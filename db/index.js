const Database = require('better-sqlite3');
const db = new Database('bot.db', { verbose: console.log });
module.exports = db;