const db = require('../db');

console.log('Starting balance fix for all users...');

db.serialize(() => {
    db.run('UPDATE users SET balance = 1000.00', function (err) {
        if (err) {
            console.error('Error updating balances:', err.message);
        } else {
            console.log(`Successfully reset balance for ${this.changes} users.`);
        }
    });

    db.all('SELECT id, username, name, balance FROM users', (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err.message);
        } else {
            console.log('\nCurrent Database State:');
            console.table(rows);
        }
    });
});
