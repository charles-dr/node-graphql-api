
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));

const bgFemales = ["#BDB6C5", "#FEC9C9", "#F9665E", "#FEA995", "#E6887E", "#D0606E", "#B64C63", "#E6DCE5", "#EFA18B", "#F8D1AA", "#FED5CF", "#FFA4AB", "#C6B2BB", "#D2ACD3", "#C587AE", "#F6B9C9", "#F0A272", "#CE91AD"];
const bgMales = ["#779ECB", "#AFB8C2", "#AEC6CF", "#799FCB", "#95B4CC", "#AFC7D0", "#AECECF", "#7EB1B3", "#ADABB1", "#AFCDCB", "#73AEAA", "#8F838D", "#9399A9", "#8C75A1", "#B9DADF", "#7DC0D1", "#D4834A", "#E1775C"];
const textColor = '#6E6A6C';

module.exports = {

  generateColorPair: (gender = 'MALE', color = {}) => {
    if (color.background && color.text) return color;

    const colorArray = gender === 'FEMALE' ? bgFemales : bgMales;
    const rand = Math.floor(Math.random() * colorArray.length);

    color.text = textColor;
    color.background = colorArray[rand];
    return color;
  }
}
