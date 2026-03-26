const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../db.json');

function ensureDbFile() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbFile();

  const raw = fs.readFileSync(dbPath, 'utf-8').trim();

  if (!raw) {
    return { users: [] };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { users: [] };
  }
}

function writeDb(data) {
  ensureDbFile();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readDb,
  writeDb
};