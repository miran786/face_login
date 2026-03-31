const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateJWT = require('../middleware/auth');

// GET /api/users/contacts
// Returns a list of all registered users except the current user
router.get('/contacts', authenticateJWT, (req, res) => {
    const currentUserId = req.user.id;

    db.all(
        'SELECT id, username, name FROM users WHERE id != ?',
        [currentUserId],
        (err, rows) => {
            if (err) {
                console.error('Error fetching contacts:', err);
                return res.status(500).json({ error: 'Database error fetching contacts' });
            }
            res.json({ contacts: rows });
        }
    );
});

// GET /api/users/profile — return full profile for logged-in user
router.get('/profile', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    db.get(
        'SELECT id, username, name, email, phone FROM users WHERE id = ?',
        [userId],
        (err, user) => {
            if (err) {
                console.error('Error fetching profile:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        }
    );
});

// PUT /api/users/profile — update name, email, phone for logged-in user
router.put('/profile', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
    }

    // Validate email format if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    }

    // Validate phone — exactly 10 digits
    if (phone) {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            return res.status(400).json({ error: 'Phone must be exactly 10 digits' });
        }
    }

    db.run(
        'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
        [name.trim(), email || null, phone || null, userId],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed: users.email')) {
                    return res.status(409).json({ error: 'Email already in use by another account' });
                }
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            db.get(
                'SELECT id, username, name, email, phone FROM users WHERE id = ?',
                [userId],
                (err2, user) => {
                    if (err2 || !user) return res.status(500).json({ error: 'Database error' });
                    res.json({ success: true, user });
                }
            );
        }
    );
});

module.exports = router;
