const fs = require('fs');
const path = require('path');

const rentPath = path.join(__dirname, 'data', 'rent.json');

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(rentPath)) fs.writeFileSync(rentPath, '{}');



function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath));
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}


function loadRent() {
  return JSON.parse(fs.readFileSync(rentPath));
}

function saveRent(data) {
  fs.writeFileSync(rentPath, JSON.stringify(data, null, 2));
}

function getCurrentMonth() {
  const now = new Date();
  return now.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "June 2025"
}

function ensureMonthExists(data) {
  const currentMonth = getCurrentMonth();
  if (!data[currentMonth]) {
    data[currentMonth] = {};
  }
  return currentMonth;
} 


// Export functions

module.exports = {
  loadRent,
  saveRent,
  getCurrentMonth,
  ensureMonthExists,
  rentPath,
  loadJSON,
  saveJSON
};

