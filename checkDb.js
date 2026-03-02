const db = require('./backend/db');
db.initPromise.then(() => {
    console.log("Database initialized");
    db.all('SELECT * FROM users LIMIT 1', (err, rows) => {
        if (err) console.error("Users Table Error:", err);
        else console.log("Users:", rows);

        db.all('SELECT * FROM transactions LIMIT 1', (err, rows) => {
            if (err) console.error("Transactions Table Error:", err);
            else console.log("Transactions:", rows);
            process.exit(0);
        });
    });
}).catch(err => console.error("DB Error:", err));
