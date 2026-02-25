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
            console.log(`Found ${rows.length} contacts for user ${currentUserId}`);
            res.json({ contacts: rows });
        }
    );

});

module.exports = router;
