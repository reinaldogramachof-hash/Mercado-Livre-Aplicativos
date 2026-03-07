const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// We are specifically looking for an open div in the view-transactions section.
const startIdx = html.indexOf('<section id="view-transactions"');
const endIdx = html.indexOf('</section>', startIdx);

const sectionHtml = html.substring(startIdx, endIdx + 10);

const openDivs = (sectionHtml.match(/<div(\s|>)/g) || []).length;
const closeDivs = (sectionHtml.match(/<\/div>/g) || []).length;

console.log('view-transactions div count:');
console.log('Open:', openDivs);
console.log('Close:', closeDivs);

// check modal
const modalStart = html.indexOf('<div id="transactionModal"');
const modalEnd = html.indexOf('<!-- Client Modal -->');
const modalHtml = html.substring(modalStart, modalEnd);

const modalOpenDivs = (modalHtml.match(/<div(\s|>)/g) || []).length;
const modalCloseDivs = (modalHtml.match(/<\/div>/g) || []).length;

console.log('transactionModal div count:');
console.log('Open:', modalOpenDivs);
console.log('Close:', modalCloseDivs);

// check renderTransactions
const funcStart = html.indexOf('function renderTransactions()');
const funcEnd = html.indexOf('function deleteTransaction');
const funcHtml = html.substring(funcStart, funcEnd);

const funcOpenDivs = (funcHtml.match(/<div(\s|>)/g) || []).length;
const funcCloseDivs = (funcHtml.match(/<\/div>/g) || []).length;

console.log('renderTransactions div count:');
console.log('Open:', funcOpenDivs);
console.log('Close:', funcCloseDivs);
