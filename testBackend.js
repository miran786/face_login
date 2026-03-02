const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'face-wallet-secure-secret-key-2024';
const db = require('./backend/db');

async function test() {
    // wait for db
    await db.initPromise;
    console.log("DB inited");

    db.get('SELECT * FROM users LIMIT 1', async (err, user) => {
        if (err || !user) {
            console.log("No users found", err);
            return;
        }
        console.log("Found user:", user.username);

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

        const resBalance = await fetch('http://localhost:5000/api/wallet/balance', {
            headers: { 'Cookie': `token=${token}` }
        });
        console.log("Balance status:", resBalance.status, await resBalance.text());

        const resHistory = await fetch('http://localhost:5000/api/wallet/history', {
            headers: { 'Cookie': `token=${token}` }
        });
        console.log("History status:", resHistory.status, await resHistory.text());

        process.exit(0);
    });
}

test();
