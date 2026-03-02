const db = require('./backend/db/index');
db.initPromise.then(() => {
    console.log("Database initialized");
    db.serialize(() => {
        db.run('DELETE FROM transactions', (err) => {
            if (err) console.error("Transactions Error:", err);
            else console.log("Transactions cleared.");
        });
        db.run('DELETE FROM passkeys', (err) => {
            if (err) console.error("Passkeys Error:", err);
            else console.log("Passkeys cleared.");
        });
        db.run('DELETE FROM users', (err) => {
            if (err) console.error("Users Error:", err);
            else console.log("Users cleared.");
        });
        db.run('VACUUM', (err) => {
            if (err) console.error("Vacuum Error:", err);
            else console.log("Database vacuumed.");
            process.exit(0);
        });
    });
}).catch(err => console.error("DB Error:", err));
