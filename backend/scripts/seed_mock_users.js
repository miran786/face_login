const db = require('../db');
const crypto = require('crypto');

const mockUsers = [
    { name: 'Sarah Wilson', username: 'sarah_w', email: 'sarah@example.com' },
    { name: 'James Chen', username: 'james_c', email: 'james@example.com' },
    { name: 'Elena Rodriguez', username: 'elena_r', email: 'elena@example.com' },
    { name: 'Marcus Thorne', username: 'marcus_t', email: 'marcus@example.com' }
];

console.log('Seeding mock users...');

db.serialize(() => {
    mockUsers.forEach(user => {
        const userId = crypto.randomUUID();
        db.run(
            `INSERT OR IGNORE INTO users (id, username, email, name, balance) VALUES (?, ?, ?, ?, ?)`,
            [userId, user.username, user.email, user.name, 1000.00],
            function (err) {
                if (err) {
                    console.error(`Error adding ${user.username}:`, err.message);
                } else if (this.changes > 0) {
                    console.log(`Added mock user: ${user.name} (${user.username})`);
                } else {
                    console.log(`User ${user.username} already exists, skipping.`);
                }
            }
        );
    });

    db.all('SELECT id, username, name, balance FROM users', (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err.message);
        } else {
            console.log('\nFinal User List:');
            console.table(rows);
        }
    });
});
