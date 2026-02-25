const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

// Basic Username/Password Registration
router.post('/', async (req, res) => {
    const { username, name, password, email, phone } = req.body;

    if (!username || !name || !password) {
        return res.status(400).json({ error: 'Username, name, and password are required' });
    }

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const userId = crypto.randomUUID();

        db.run(
            `INSERT INTO users (id, username, email, phone, name, password_hash, balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, email || null, phone || null, name, passwordHash, 1000.00],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'Username already exists' });
                    }
                    console.error(err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                // Generate JWT
                const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });

                // Set HttpOnly cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                res.status(201).json({ message: 'User registered successfully', userId, user: { id: userId, username, name, email } });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Passwordless Registration (for WebAuthn/FaceID initial step)
router.post('/passkey', (req, res) => {
    const { username, name, email, phone } = req.body;

    if (!username || !name) {
        return res.status(400).json({ error: 'Username and name are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, existingUser) => {
        if (err) return res.status(500).json({ error: 'Internal server error' });

        if (existingUser) {
            // If the user exists, check if they have a password. If they do, they must use traditional login.
            if (existingUser.password_hash) {
                return res.status(409).json({ error: 'Username already exists with a password. Please login or use a different username.' });
            }

            // If they don't have a password, check if they already have passkeys.
            db.get('SELECT COUNT(*) as count FROM passkeys WHERE userId = ?', [existingUser.id], (err, row) => {
                if (err) return res.status(500).json({ error: 'Internal server error' });
                if (row.count > 0) {
                    return res.status(409).json({ error: 'User already has a passkey registered. Please login.' });
                }

                // User exists, has no password, and no passkeys. This means they cancelled a previous registration attempt.
                // Treat it as a successful initialization and return their existing ID.
                return res.status(200).json({ message: 'User re-initialized for passkey', userId: existingUser.id });
            });
            return;
        }

        const userId = crypto.randomUUID();

        db.run(
            `INSERT INTO users (id, username, email, phone, name, password_hash, balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, email || null, phone || null, name, null, 1000.00],
            function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                res.status(201).json({ message: 'User initialized for passkey', userId });
            }
        );
    });
});

module.exports = router;
