const textToSvg = require('text-to-svg');
const instance = textToSvg.loadSync('../fonts/fira-code-regular.woff');
console.log(instance.getSVG('-px'));