const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to DB:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    // Add balance to users
    db.run("ALTER TABLE users ADD COLUMN balance DECIMAL DEFAULT 1000.00;", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("Error adding balance column:", err.message);
        } else {
            console.log("Balance column added or already exists.");
        }
    });

    // Create transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (recipient_id) REFERENCES users(id)
      )
    `, (err) => {
        if (err) {
            console.error("Error creating transactions table:", err.message);
        } else {
            console.log("Transactions table created.");
        }
        db.close();
    });
});
