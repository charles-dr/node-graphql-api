const uuid = require('uuid/v4');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');
const AWS = require('aws-sdk');
const ffmpeg = require('ffmpeg');
const FfmpegCommand = require('fluent-ffmpeg');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { aws, cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));
const { VideoCropMode } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

const s3 = new AWS.S3();


const copyFileStream = (readStream, writeStream) => {
	return new Promise((resolve, reject) => {
		readStream.pipe(writeStream)
			.on('close', () => resolve(true))
			.on('error', (err) => reject(err))
	});
}

const getNewAspect = ({ w, h }) => {
	return Math.max(w, h);
}

const generateCropParams = ({ w, h }) => {
	const aspect = Math.min(w, h);
	let sx = w > h ? (w-h) / 2 : 0;
	let sy = w < h ? (h-w) / 2 : 0;
	return `${aspect}:${aspect}:${sx}:${sy}`;
}

const cropVideo = async (originPath, resolution, ext, cropMode = VideoCropMode.AUTO_PAD) => {
	return cropMode === VideoCropMode.FILL_FRAME ? fillFrameVideo(originPath, resolution, ext) : autoPadVideo(originPath, resolution, ext);
}

const autoPadVideo = async (originPath, resolution, ext) => {
	const command = new FfmpegCommand(originPath);
	let newAspect = Math.min(resolution.w, resolution.h, 640); console.log('newAspect', newAspect);
	const strId = uuid();
	const targetPath = path.join(os.tmpdir(), `${strId}.${ext}`);
	return new Promise((resolve, reject) => {
		command
			.size(`${newAspect}x${newAspect}`)
			.withAspect(1)
			.videoBitrate('490')
			.applyAutoPadding(true, '#000000')
			.output(targetPath)
			.on('end', () => resolve(targetPath))
			.on('error', error => reject(error))
			.run();
	});
}

const fillFrameVideo = async (originPath, resolution, ext) => {
	const command = new FfmpegCommand(originPath);
	const newAspect = Math.min(resolution.w, resolution.h, 640);
	const strId = uuid();
	const targetPath = path.join(os.tmpdir(), `${strId}.${ext}`);
	return new Promise((resolve, reject) => {
		command
			.size(`${newAspect}x${newAspect}`)
			.videoBitrate('490')
			.output(targetPath)
			.videoFilters([
				{ 
					filter: 'crop',
					options: generateCropParams(resolution)
				}
			])
			.on('end', () => resolve(targetPath))
			.on('error', error => reject(error))
			.run();
	});
}

const removeFile = async (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) reject(err);
      resolve(true);
    })
  })
}


module.exports = async (root, { assetId, file, cropMode = VideoCropMode.AUTO_PAD}, { user, dataSources: { repository } }) => {

  let { type: mimetype, base64: base64Data } = file;
	const { ext, type } = MIMEAssetTypes.detect(mimetype);

  base64Data = base64Data.indexOf('base64,') > -1 ? base64Data.substring(base64Data.indexOf('base64,') + 7) : base64Data;

	let size = 100;
	let tmpFileName = '';
	let resolution = {};
	const validator = new Validator({ base64Data, mimetype, size, assetId }, {
    base64Data: 'required',
		mimetype: 'required',
    size: 'required',
    assetId: 'required',
	});
  
	validator.addPostRule(async (input) => {
		if (!MIMEAssetTypes.detect(input.inputs.mimetype)) {
			validator.addError('mimetype', 'custom', 'API does not support this mimetype');
		}
		// save file to local temporary Directory
		if (!['mp4', 'mov'].includes(ext)) {
			validator.addError('mimetype', 'custom', 'MP4 or MOV files are only allowed!');
    }
    // check if asset exists or not.
    repository.asset.load(assetId)
      .then(asset => {
        if (!asset) {
          validator.addError('assetId', 'custom', `Asset with id "${assetId}" does not exist!`);
        }
      });

    tmpFileName = `${uuid()}.${ext}`;
    fs.writeFileSync(path.join(os.tmpdir(), tmpFileName), base64Data, 'base64', async function(err) {
      if (err) {
        validator.addError('file', 'custom', 'File upload error!')
      }
    });

    const stats = fs.statSync(path.join(os.tmpdir(), tmpFileName));
    size = stats['size'];
    if (size / 1024 / 1024 > 50.0) {
      validator.addError('file', 'custom', 'Preview video must be 50MB at max!');
    }
    ffmpeg(path.join(os.tmpdir(), tmpFileName))
    .then((video) => {
      // check video metadata
      if (video.metadata.duration.seconds > 10) {
        validator.addError('file', 'custom', 'Video must be 10 seconds long at max!');
      }
    })
    .catch(error => validator.addError('file', 'custom', 'Video processing error!'));
	});

	return validator.check()
		.then((matched) => {
			if (!matched) {
				throw errorHandler.build(validator.errors);
			}
			return ffmpeg(path.join(os.tmpdir(), tmpFileName));
		})
		.then(video => {
			resolution = video.metadata.video.resolution;
			const tmpPath = path.join(os.tmpdir(), tmpFileName);
			if (resolution.w === resolution.h) {
				return tmpPath;
			} else {
				return cropVideo(tmpPath, video.metadata.video.resolution, ext, cropMode);
			}
		})
    .then(filePath => Promise.all([
      filePath,
      repository.asset.load(assetId)
    ]))
    .then(([filePath, asset]) => {
      const stats = fs.statSync(filePath);
      const strPath = asset.path;
      asset.forPreview = true;
      asset.size = stats['size'];
			// console.log('[Valid check]', size);
			return Promise.all([
				s3.upload({
					Bucket: aws.user_bucket,
					Key: strPath,
					Body: fs.createReadStream(filePath),
        }).promise(),
        asset.save(),
        removeFile(path.join(os.tmpdir(), tmpFileName)) // remove temp file
				]);
		})
		.then(([, asset]) => asset)
		// .catch((error) => {
		// 	console.log('[error]', error.message);
		// 	throw new Error(error);
		// });
}