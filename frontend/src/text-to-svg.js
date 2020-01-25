// eslint-disable-next-line import/no-extraneous-dependencies
const textToSvg = require('text-to-svg');

const instance = textToSvg.loadSync('../fonts/fira-code-regular.woff');
console.log(instance.getSVG('+10%'));
