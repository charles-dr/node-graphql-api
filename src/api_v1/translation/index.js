const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const {
	composeJSONAsset,
	deslugify,
	downloadJsonAsFile,
	generateExportDataCSV,
	generateExportDataJSON,
	getAvailableLangs,
	getCategories,
	getLangSetting,
	getPhrases
} = require('./func');

const translationRouter = express.Router();

translationRouter.route('/settings').get(async (req, res) => {
	Promise.all([
		getPhrases(), 
		getLangSetting()
	])
		.then(([rPhrases, rLangSetting]) => [rPhrases.phrases.collection, rLangSetting.langSetting])
		.then(([phrases, langSetting]) => res.json({
				status: true,
				langs: getAvailableLangs(phrases),
				version: langSetting.version
			}))
		.catch(error => res.json({
			status: false, 
			message: error.message
		}));
});

translationRouter.route('/export/json').get(async (req, res) => {
	getPhrases()
		.then(response => {
			const phrases = response.phrases.collection;
			const availableLangs = getAvailableLangs(phrases);
			const exportData = generateExportDataJSON(phrases);

			res.setHeader('Content-disposition', 'attachment; filename=langs.json');
			res.setHeader('Content-type', 'application/json');
			res.charset = 'UTF-8';
			res.write(JSON.stringify(exportData));
			res.end();
		})
		.catch(error => {
			return res.json({ status: false, message: error.message });
		});
});

translationRouter.route('/export/csv').get(async (req, res) => {
	getPhrases()
		.then(response => {
			const phrases = response.phrases.collection;
			const availableLangs = getAvailableLangs(phrases);
			const exportData = generateExportDataCSV(phrases);

			res.setHeader('Content-disposition', 'attachment; filename=langs.csv');
			res.setHeader('Content-type', 'text/csv');
			res.charset = 'UTF-8';
			res.write("\uFEFF");
			res.write(`Slug,Category,${availableLangs.join(',')}\n`);
			for (const key in exportData) {
				const tempArr = key.split('__');
				res.write(`${tempArr[0]},${tempArr[1]},${exportData[key].join(',')}\n`);
			}
			res.end();
		})
		.catch(error => {
			return res.json({ status: false, message: error.message });
		});
});

translationRouter.route('/drawMenu').get(async (req, res) => {
	fs.readFile(path.join(__dirname, 'dummy_json/drawMenu.json'), 'utf8', (err, data) => {
		if (err) {
			return res.json({ status: false, message: err.message });
		} else {
			res.setHeader('Content-disposition', 'attachment; filename=drawMenu.json');
			res.setHeader('Content-type', 'application/json');
			res.charset = 'UTF-8';
			res.write(data);
			res.end();
		}
	});
});

translationRouter.route('/:langCode').get(async (req, res) => {
	const langCode = req.params.langCode.toUpperCase();
	Promise.all([
		getPhrases(),
		getCategories()
	])
		.then(([resp1, resp2]) => [resp1.phrases.collection, resp2.phraseCategories])
		.then(([phrases, categories]) => {
			return downloadJsonAsFile(res, composeJSONAsset(phrases, categories, langCode), langCode);
		})
		.catch(error => res.json({ status: false, message: error.message}));
})

translationRouter.route('/en').get(async (req, res) => {
	fs.readFile(path.join(__dirname, 'dummy_json/en.json'), 'utf8', (err, data) => {
		if (err) {
			return res.json({ status: false, message: err.message });
		} else {
			
			res.setHeader('Content-disposition', 'attachment; filename=en.json');
			res.setHeader('Content-type', 'application/json');
			res.charset = 'UTF-8';
			res.write(data);
			res.end();
		}
	});
});

translationRouter.route('/zh').get(async (req, res) => {
	fs.readFile(path.join(__dirname, 'dummy_json/zh.json'), 'utf8', (err, data) => {
		if (err) {
			return res.json({ status: false, message: err.message });
		} else {
			res.setHeader('Content-disposition', 'attachment; filename=zh.json');
			res.setHeader('Content-type', 'application/json');
			res.charset = 'UTF-8';
			res.write(data);
			res.end();
		}
	});
});

module.exports = translationRouter;
