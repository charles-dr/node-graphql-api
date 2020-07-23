const { request, gql } = require('graphql-request');

const base_url = "http://localhost:4000/graphql";
const phraseQuery = gql`
	query Phrases($limit: Int) {
		phrases(
			page:{
				skip:0
				limit:$limit
			}
			sort:{
				feature:ALPHABET
				type:ASC
			}
		){
			# pager{
			#     total limit
			# }
			collection{
				#id
				slug
				category{id name}
				translations {
					lang{id}
					text
				}
			}
		}
	}
`;
const phraseCategoryQuery = gql`
	query PhraseCategories {
		phraseCategories(
			parent: ""
			includeAll: true
		) {
			id
			name
			level
			hasChildren
			parent {id name}
		}
	}
`;
const langSettingQuery = gql`
	query LangSetting {
		langSetting {
			version
		}
	}
`;


const getPhrases = () => {
	return request(base_url, phraseQuery, { limit: Math.pow(2, 16) - 1 });
}

const getCategories = () => {
	return request(base_url, phraseCategoryQuery);
}

const getLangSetting = () => {
	return request(base_url, langSettingQuery);
}

const getAvailableLangs = (phrases) => {
	const tempLangs = phrases.reduce((langCodes, phraseItem) => langCodes.concat(phraseItem.translations.map(translation => translation.lang.id)), []);
	let langObj = {};
	tempLangs.map(langCode => (langObj[langCode] = 1));
	return Object.keys(langObj).sort((a, b) => a > b ? 1 : -1);
}

const deslugify = (str) => {
	return str.replace(/_/g, ' ');
}

const slugify = str => {
	return str.replace(/\s+/g, '_')
		.replace(/-/g, '_');
}

const transformTranslationItemCSV = (phraseItem, availableLangs) => {
	let texts = [];
	const translationObj = {};
	phraseItem.translations.map(translation => translationObj[`${translation.lang.id}`] = translation.text);
	for (let langCode of availableLangs) {
		texts.push(translationObj[langCode] || deslugify(phraseItem.slug));
	}
	return texts;
}

const generateExportDataCSV = (phrases) => {
	const availableLangs = getAvailableLangs(phrases);
	const mapObj = {};
	phrases.map(phraseItem => mapObj[`${slugify(phraseItem.slug)}__${phraseItem.category.id || ""}`] = transformTranslationItemCSV(phraseItem, availableLangs))
	return mapObj;
}

const transformTranslationItemJSON = (phraseItem, availableLangs) => {
	const translationObj = {};
	phraseItem.translations.map(translation => translationObj[translation.lang.id] = translation.text);
	const finalObj = {};
	for (let langCode of availableLangs) {
		finalObj[langCode] = translationObj[langCode] || deslugify(phraseItem.slug);
	}
	return finalObj;
}

const generateExportDataJSON = (phrases) => {
	const availableLangs = getAvailableLangs(phrases);
	const mapObj = {};
	phrases.map(phraseItem => mapObj[slugify(phraseItem.slug)] = transformTranslationItemJSON(phraseItem, availableLangs))
	return mapObj;
}

const getChildrenInfo = (phrases, categories, parent) => {
	const childPhrases = phrases.filter(phrase => phrase.category.id === parent);
	const childCategories = categories.filter(category => ((parent === null && category.parent === null) || (category.parent && category.parent.id === parent)));
	return {
		phrases: childPhrases,
		categories: childCategories,
	}
}

const composeJSONAsset = (phrases, categories, lang = 'EN', parent = null) => {
	const children = getChildrenInfo(phrases, categories, parent); //return children;
	let asset = {};
	if (children.phrases.length > 0) {
		children.phrases.forEach(phrase => {
			const [translationItem] = phrase.translations.filter(item => item.lang.id === lang);
			asset[slugify(phrase.slug)] = translationItem ? translationItem.text : deslugify(phrase.slug);
		});
	}

	if (children.categories.length > 0) {
		children.categories.forEach(category => {
			asset[slugify(category.name)] = composeJSONAsset(phrases, categories, lang, category.id);
		});
	}
	return asset;
}

const downloadJsonAsFile = (res, data, langCode) => {
	res.setHeader('Content-disposition', `attachment; filename=${langCode.toLowerCase()}.json`);
	res.setHeader('Content-type', 'application/json');
	res.charset = 'UTF-8';
	res.write(JSON.stringify(data));
	res.end();
}


module.exports = {
	composeJSONAsset,
	deslugify,
	downloadJsonAsFile,
	generateExportDataCSV,
	generateExportDataJSON,
	getAvailableLangs,
	getCategories,
	getLangSetting,
	getPhrases
};
