const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateJWT = require('../middleware/auth');
const crypto = require('crypto');

// GET /api/wallet/balance
router.get('/balance', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error('Error fetching balance:', err);
            return res.status(500).json({ error: 'Database error fetching balance.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ balance: row.balance });
    });
});

// GET /api/wallet/history
router.get('/history', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT t.id, t.amount, t.created_at as date,
               CASE 
                   WHEN t.sender_id = ? THEN 'sent' 
                   ELSE 'received' 
               END as type,
               CASE 
                   WHEN t.sender_id = ? THEN (SELECT name FROM users WHERE id = t.recipient_id) 
                   ELSE (SELECT name FROM users WHERE id = t.sender_id) 
               END as recipient
        FROM transactions t
        WHERE t.sender_id = ? OR t.recipient_id = ?
        ORDER BY t.created_at DESC
    `;

    db.all(query, [userId, userId, userId, userId], (err, rows) => {
        if (err) {
            console.error('Error fetching transaction history:', err);
            return res.status(500).json({ error: 'Database error fetching history.' });
        }

        // Format to match frontend expectations
        const transactions = rows.map(r => ({
            id: r.id,
            type: r.type,
            amount: r.amount,
            recipient: r.recipient,
            date: r.date,
            status: 'completed'
        }));

        res.json({ transactions });
    });
});

// POST /api/wallet/transfer
router.post('/transfer', authenticateJWT, async (req, res) => {
    const senderId = req.user.id;
    const { contactName, amount } = req.body; // Using contactName from SendMoney UI

    if (!contactName || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid recipient or amount.' });
    }

    // Round to 2 decimal places to prevent fractional precision issues
    const sanitizedAmount = Math.round(amount * 100) / 100;
    if (sanitizedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero.' });
    }

    const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    try {
        await dbRun('BEGIN TRANSACTION');

        const recipientRow = await dbGet('SELECT id FROM users WHERE name = ? COLLATE NOCASE', [contactName]);
        if (!recipientRow) {
            await dbRun('ROLLBACK');
            return res.status(400).json({ error: 'Recipient not found.' });
        }
        const recipientId = recipientRow.id;

        if (senderId === recipientId) {
            await dbRun('ROLLBACK');
            return res.status(400).json({ error: 'Cannot send money to yourself.' });
        }

        // Atomic deduction: only succeeds if balance is sufficient (prevents race condition)
        const deductResult = await dbRun(
            'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
            [sanitizedAmount, senderId, sanitizedAmount]
        );
        if (deductResult.changes === 0) {
            await dbRun('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient funds.' });
        }

        await dbRun('UPDATE users SET balance = balance + ? WHERE id = ?', [sanitizedAmount, recipientId]);

        const transactionId = crypto.randomUUID();
        await dbRun('INSERT INTO transactions (id, sender_id, recipient_id, amount) VALUES (?, ?, ?, ?)', [transactionId, senderId, recipientId, sanitizedAmount]);

        await dbRun('COMMIT');
        res.json({ success: true, transactionId });
    } catch (error) {
        console.error('Transfer transaction error:', error);
        // Attempt to rollback on error, ignore if rollback also fails
        await dbRun('ROLLBACK').catch(e => console.error('Rollback failed:', e));
        res.status(500).json({ error: 'Internal server error during transfer.' });
    }
});

module.exports = router;
