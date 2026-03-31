const express = require('express');
const router = express.Router();
const db = require('../db');

// DELETE /api/admin/clear-data
// Deletes ALL users, face descriptors, and transactions from the database.
// This is a destructive operation — only call after explicit user confirmation.
router.delete('/clear-data', (req, res) => {
    db.serialize(() => {
        db.run('DELETE FROM transactions', (err) => {
            if (err) {
                console.error('Error clearing transactions:', err);
                return res.status(500).json({ error: 'Failed to clear transaction data' });
            }

            db.run('DELETE FROM face_descriptors', (err) => {
                if (err) {
                    console.error('Error clearing face descriptors:', err);
                    return res.status(500).json({ error: 'Failed to clear face data' });
                }

                db.run('DELETE FROM users', (err) => {
                    if (err) {
                        console.error('Error clearing users:', err);
                        return res.status(500).json({ error: 'Failed to clear user data' });
                    }

                    res.json({ success: true, message: 'All data cleared successfully' });
                });
            });
        });
    });
});

module.exports = router;
