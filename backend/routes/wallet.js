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
        res.json({ balance: row ? row.balance : 0 });
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
router.post('/transfer', authenticateJWT, (req, res) => {
    const senderId = req.user.id;
    const { contactName, amount } = req.body; // Using contactName from SendMoney UI

    if (!contactName || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid recipient or amount.' });
    }

    // Begin transaction flow
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) return res.status(500).json({ error: 'Database error.' });

            // Find recipient user by name (assuming name is unique enough for this demo otherwise we would use exact username or id)
            db.get('SELECT id FROM users WHERE name = ? COLLATE NOCASE', [contactName], (err, recipientRow) => {
                if (err || !recipientRow) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: 'Recipient not found.' });
                }
                const recipientId = recipientRow.id;

                if (senderId === recipientId) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: 'Cannot send money to yourself.' });
                }

                // Check sender balance
                db.get('SELECT balance FROM users WHERE id = ?', [senderId], (err, senderRow) => {
                    if (err || !senderRow || senderRow.balance < amount) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: 'Insufficient funds.' });
                    }

                    // Deduct from sender
                    db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, senderId], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to update sender balance.' });
                        }

                        // Add to recipient
                        db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, recipientId], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Failed to update recipient balance.' });
                            }

                            // Log transaction
                            const transactionId = crypto.randomUUID();
                            db.run('INSERT INTO transactions (id, sender_id, recipient_id, amount) VALUES (?, ?, ?, ?)',
                                [transactionId, senderId, recipientId, amount], (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        return res.status(500).json({ error: 'Failed to log transaction.' });
                                    }

                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            return res.status(500).json({ error: 'Failed to commit transaction.' });
                                        }
                                        res.json({ success: true, transactionId });
                                    });
                                });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
