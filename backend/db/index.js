const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Prevent SQLITE_BUSY errors under concurrent access
db.configure('busyTimeout', 3000);

const schemaPath = path.resolve(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const initPromise = new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database:', err.message);
            reject(err);
        } else {
            console.log('Database initialized successfully.');
            resolve();
        }
    });
});

module.exports = db;
module.exports.initPromise = initPromise;
