const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const divsOpen = (html.match(/<div(\s|>)/gi) || []).length;
const divsClose = (html.match(/<\/div>/gi) || []).length;

console.log('Global div counts:');
console.log('Open:', divsOpen);
console.log('Close:', divsClose);
