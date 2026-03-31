const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const cookieParser = require('cookie-parser');
const db = require('./db');

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/register', require('./routes/register'));
app.use('/api/face', require('./routes/face'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/users', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Wait for DB initialization before starting server
db.initPromise.then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
        console.log('Shutting down gracefully...');
        server.close(() => {
            db.close(() => {
                console.log('Database connection closed.');
                process.exit(0);
            });
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}).catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
