const express = require('express');
const router = express.Router();
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const db = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

const rpName = 'FaceLoginApp';
const rpID = 'localhost';
const origin = `http://${rpID}:5173`;

// 1. Generate Registration Options
router.post('/register/generate-options', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Get user from DB
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(404).json({ error: 'User not found. Try traditional registration first to create an account.' });

        // In a real app, user.id should be a stable ID like a UUID, we have id TEXT
        const userWebAuthnId = user.id;

        // Get existing passkeys for user
        db.all('SELECT * FROM passkeys WHERE userId = ?', [user.id], async (err, passkeys = []) => {
            try {
                console.log('Generating options for user:', user.username, 'ID:', userWebAuthnId);
                const options = await generateRegistrationOptions({
                    rpName,
                    rpID,
                    userID: Buffer.from(userWebAuthnId),
                    userName: user.username,
                    // Exclude existing credentials
                    excludeCredentials: passkeys.map(key => ({
                        id: key.credentialID,
                        type: 'public-key',
                        transports: key.transports ? key.transports.split(',') : ['internal'],
                    })),
                    attestationType: 'none',
                    authenticatorSelection: {
                        residentKey: 'required',
                        userVerification: 'preferred',
                    },
                });

                // Save current challenge to user session or DB
                db.run('UPDATE users SET current_challenge = ? WHERE id = ?', [options.challenge, user.id]);

                res.json(options);
            } catch (error) {
                console.error('Error in generateRegistrationOptions:', error);
                res.status(500).json({ error: error.message });
            }
        });
    });
});

// 2. Verify Registration
router.post('/register/verify', async (req, res) => {
    const { username, response } = req.body;

    if (!username || !response) {
        return res.status(400).json({ error: 'Username and WebAuthn response are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'User not found' });

        if (!user.current_challenge) {
            return res.status(400).json({ error: 'No active challenge found for user' });
        }

        try {
            const verification = await verifyRegistrationResponse({
                response,
                expectedChallenge: user.current_challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
            });

            if (verification.verified && verification.registrationInfo) {
                const { registrationInfo } = verification;
                const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

                // Save the passkey
                db.run(`
          INSERT INTO passkeys (credentialID, publicKey, counter, deviceType, backedUp, transports, userId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
                    credentialID,
                    credentialPublicKey,
                    counter,
                    credentialDeviceType,
                    credentialBackedUp ? 1 : 0,
                    response.response.transports ? response.response.transports.join(',') : '',
                    user.id
                ]);

                // Clear challenge
                db.run('UPDATE users SET current_challenge = NULL WHERE id = ?', [user.id]);

                res.json({ success: true, verified: true });
            } else {
                res.status(400).json({ error: 'Verification failed' });
            }
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    });
});

// 3. Generate Authentication Options (Discoverable Credentials)
router.post('/auth/generate-options', async (req, res) => {
    try {
        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'preferred',
        });

        // Save challenge globally or in session
        const tempChallengeId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);

        // Ensure table exists
        db.run('CREATE TABLE IF NOT EXISTS login_challenges (id TEXT PRIMARY KEY, challenge TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)', () => {
            db.run('INSERT INTO login_challenges (id, challenge) VALUES (?, ?)', [tempChallengeId, options.challenge]);
        });

        res.json({ options, sessionId: tempChallengeId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Verify Authentication
router.post('/auth/verify', (req, res) => {
    const { sessionId, response } = req.body;
    if (!sessionId || !response) return res.status(400).json({ error: 'Session ID and response required' });

    db.get('SELECT * FROM login_challenges WHERE id = ?', [sessionId], (err, challengeRecord) => {
        if (err || !challengeRecord) return res.status(404).json({ error: 'Challenge not found or expired' });

        db.get('SELECT * FROM passkeys WHERE credentialID = ?', [response.id], async (err, passkey) => {
            if (err || !passkey) return res.status(404).json({ error: 'Passkey not found' });

            db.get('SELECT * FROM users WHERE id = ?', [passkey.userId], async (err, user) => {
                if (err || !user) return res.status(404).json({ error: 'User not found' });

                try {
                    const verification = await verifyAuthenticationResponse({
                        response,
                        expectedChallenge: challengeRecord.challenge,
                        expectedOrigin: origin,
                        expectedRPID: rpID,
                        authenticator: {
                            credentialID: passkey.credentialID,
                            credentialPublicKey: passkey.publicKey,
                            counter: passkey.counter,
                        },
                    });

                    if (verification.verified) {

                        // Update counter
                        db.run('UPDATE passkeys SET counter = ? WHERE credentialID = ?', [verification.authenticationInfo.newCounter, passkey.credentialID]);
                        db.run('DELETE FROM login_challenges WHERE id = ?', [sessionId]);

                        // Generate JWT
                        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

                        // Set HttpOnly cookie
                        res.cookie('token', token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: 24 * 60 * 60 * 1000 // 24 hours
                        });

                        // Strip sensitive data before sending user back
                        delete user.password_hash;
                        delete user.current_challenge;
                        res.json({ success: true, verified: true, user });
                    } else {
                        res.status(400).json({ error: 'Verification failed' });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(400).json({ error: error.message });
                }
            });
        });
    });
});

module.exports = router;
