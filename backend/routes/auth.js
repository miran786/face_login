const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

// Default Username/Password login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        try {
            // Face-only users have null password_hash
            if (!user.password_hash) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: 'Invalid username or password', email: user.email });
            }
        } catch (e) {
            console.error('Auth error:', e);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, name: user.name, email: user.email, phone: user.phone } });
    });
});

// Get current user (session persistence)
router.get('/me', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        db.get(`SELECT id, username, name, email, phone FROM users WHERE id = ?`, [decoded.id], (err, user) => {
            if (err) {
                console.error('Database error in /me:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            res.json({ user });
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Verify password (for transaction auth fallback when face fails)
// Requires the user to be logged in (JWT cookie present)
router.post('/verify-password', authenticateJWT, async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    db.get(`SELECT password_hash FROM users WHERE id = ?`, [userId], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'No password set for this account' });
        }

        try {
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: 'Incorrect password' });
            }
            res.json({ success: true, message: 'Password verified' });
        } catch (e) {
            console.error('Password verify error:', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// Reset password (called after frontend OTP verification via EmailJS)
// Does NOT require login — user is in forgot-password flow
router.post('/reset-password', (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            // Don't reveal whether email exists
            return res.json({ success: true, message: 'If that email exists, the password has been updated.' });
        }

        try {
            const hash = await bcrypt.hash(newPassword, 10);
            db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, user.id], (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                res.json({ success: true, message: 'Password updated successfully' });
            });
        } catch (e) {
            console.error('Hash error:', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
});

module.exports = router;
