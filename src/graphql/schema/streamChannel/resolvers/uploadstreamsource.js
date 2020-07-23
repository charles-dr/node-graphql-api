const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');
const AWS = require('aws-sdk');
const zlib = require('zlib');


const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const {aws, cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

// const s3Stream = require('s3-upload-stream')(new AWS.S3({
//   accessKeyId:aws.agora_api_key,
//   secretAccessKey:aws.agora_api_secret
// }));

const s3 = new AWS.S3({
  accessKeyId:aws.agora_api_key,
  secretAccessKey:aws.agora_api_secret
});

const compress = zlib.createGzip();

async function uploadprocess(stream,path)
{
	return new Promise((resolve,reject)=>{
		s3.upload({
			Bucket:aws.recorded_video,
			Key:path,
			Body:stream
		},function(s3Err,data){
			
		})	
	})
	
}

module.exports = async (root, { file }, { user, dataSources: { repository } }) => {
	const { stream, mimetype} = await file;
	const size = 100;
	const validator = new Validator({mimetype}, {
	    mimetype: 'required'
	  });
	validator.addPostRule(async (input) => {
	    if (!MIMEAssetTypes.detect(input.inputs.mimetype)) {
	      validator.addError('mimetype', 'custom', 'API does not support this mimetype');
	    }
	});

	return validator.check()
	    .then(async(matched) => {
	      if (!matched) {
	        throw errorHandler.build(validator.errors);
	      }
	      const { ext, type } = MIMEAssetTypes.detect(mimetype);
	      const id = uuid();
	      const path = `${user.id}/${id}.${ext}`;

	  
		
		uploadprocess(stream,path).then(res=>{
				
		});
		return{
      		user:user,
      		type:"VIDEO_AUDIO",
      		source:`/${path}`
      	};
	    
    });
	//return await uploadprocess(files[item],user);
	// let result = [];
	// for(let item in files)
	// {
	// 	let resultitem = await uploadprocess(files[item],user);
	// 	result.push(resultitem);
	// }

	// return result;
}
