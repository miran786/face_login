const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');

// GET /api/wallet/balance
router.get('/balance', authenticateJWT, (req, res) => {
    // Simulated balance
    res.json({ balance: 12847.50 });
});

// GET /api/wallet/history
router.get('/history', authenticateJWT, (req, res) => {
    // Simulated transaction history
    const transactions = [
        {
            id: '1',
            type: 'received',
            amount: 1250.00,
            recipient: 'Sarah Johnson',
            date: '2026-01-12T10:30:00',
            status: 'completed'
        },
        {
            id: '2',
            type: 'sent',
            amount: 350.00,
            recipient: 'Alex Martinez',
            date: '2026-01-11T15:20:00',
            status: 'completed'
        },
        {
            id: '3',
            type: 'sent',
            amount: 89.99,
            recipient: 'Coffee Shop',
            date: '2026-01-11T09:15:00',
            status: 'completed'
        },
        {
            id: '4',
            type: 'received',
            amount: 2500.00,
            recipient: 'Michael Chen',
            date: '2026-01-10T14:45:00',
            status: 'completed'
        },
    ];
    res.json({ transactions });
});

module.exports = router;
