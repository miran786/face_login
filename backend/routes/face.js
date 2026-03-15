const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

// Helper function to calculate Euclidean distance between two 128D descriptors
const euclideanDistance = (desc1, desc2) => {
    if (desc1.length !== desc2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        let diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
};

// Euclidean distance threshold for a face match (0.55 for tight matching)
// Typical range: 0.55-0.6 for secure authentication
const DISTANCE_THRESHOLD = 0.55;

// Validate that a descriptor is a 128-element array of finite numbers
const isValidDescriptor = (d) =>
    Array.isArray(d) && d.length === 128 && d.every(v => Number.isFinite(v));

// 1. Register Face Descriptor
router.post('/register', (req, res) => {
    const { username, descriptor, name, email, phone } = req.body;

    if (!username || !descriptor || !isValidDescriptor(descriptor)) {
        return res.status(400).json({ error: 'Username and a valid 128D face descriptor are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const saveDescriptor = (userId, uname) => {
            const descriptorId = crypto.randomUUID();
            const descriptorJson = JSON.stringify(descriptor);

            db.run(
                `INSERT INTO face_descriptors (id, user_id, descriptor) VALUES (?, ?, ?)`,
                [descriptorId, userId, descriptorJson],
                function (err) {
                    if (err) {
                        console.error('Error saving descriptor:', err);
                        return res.status(500).json({ error: 'Failed to save face data' });
                    }

                    // Generate JWT and set cookie so the user is logged in after registration
                    const token = jwt.sign({ id: userId, username: uname }, JWT_SECRET, { expiresIn: '24h' });
                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 24 * 60 * 60 * 1000
                    });

                    res.status(201).json({ success: true, message: 'Face data registered securely' });
                }
            );
        };

        if (user) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Create user first if registering via face for the first time
        const userId = crypto.randomUUID();
        db.run(
            `INSERT INTO users (id, username, email, phone, name, password_hash, balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, email || null, phone || null, name || username, null, 1000.00],
            function (err) {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({ error: 'Failed to create user record' });
                }
                saveDescriptor(userId, username);
            }
        );
    });
});


// 2. Login (Authenticate via Face Descriptor)
router.post('/login', (req, res) => {
    const { descriptor } = req.body;

    if (!descriptor || !isValidDescriptor(descriptor)) {
        return res.status(400).json({ error: 'Valid 128D face descriptor is required' });
    }

    // Fetch all descriptors to compare
    db.all('SELECT f.descriptor, u.id as user_id, u.username, u.name, u.email FROM face_descriptors f JOIN users u ON f.user_id = u.id', [], (err, rows) => {
        if (err) {
            console.error('Error fetching descriptors:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'No face data found in the system' });
        }

        let bestMatch = null;
        let minDistance = Infinity;

        // Iterate through all saved descriptors to find the closest match
        rows.forEach(row => {
            try {
                const savedDescriptor = JSON.parse(row.descriptor);
                const distance = euclideanDistance(descriptor, savedDescriptor);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = row;
                }
            } catch (e) {
                console.error("Failed to parse a saved descriptor", e);
            }
        });

        // Determine if the best match is within the acceptable threshold
        if (bestMatch && minDistance <= DISTANCE_THRESHOLD) {
            // Match found within threshold

            // Generate JWT
            const token = jwt.sign({ id: bestMatch.user_id, username: bestMatch.username }, JWT_SECRET, { expiresIn: '24h' });

            // Set HttpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({
                success: true,
                message: 'Login successful',
                user: { id: bestMatch.user_id, username: bestMatch.username, name: bestMatch.name, email: bestMatch.email }
            });
        } else {
            res.status(401).json({ error: 'Face not recognized' });
        }
    });
});

// 3. Verify face matches the currently logged-in user (for transaction authorization)
const authenticateJWT = require('../middleware/auth');

router.post('/verify', authenticateJWT, (req, res) => {
    const { descriptor } = req.body;
    const userId = req.user.id;

    if (!descriptor || !isValidDescriptor(descriptor)) {
        return res.status(400).json({ error: 'Valid 128D face descriptor is required' });
    }

    // Fetch only the logged-in user's descriptors
    db.all('SELECT descriptor FROM face_descriptors WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching descriptors:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: 'No face data registered for this account' });
        }

        let minDistance = Infinity;

        rows.forEach(row => {
            try {
                const savedDescriptor = JSON.parse(row.descriptor);
                const distance = euclideanDistance(descriptor, savedDescriptor);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            } catch (e) {
                console.error('Failed to parse saved descriptor', e);
            }
        });

        if (minDistance <= DISTANCE_THRESHOLD) {
            res.json({ success: true, message: 'Face verified' });
        } else {
            res.status(401).json({ error: 'Face verification failed. Please try again.' });
        }
    });
});

module.exports = router;
