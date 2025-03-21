import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import passport from 'passport';
import configurePassport from './config/passport';
import config from './config';
import logger from './utils/logger';
import queueService from './services/queue/queue-service';

// Import routes
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';

// Initialize Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session handling
app.use(session({
    secret: config.auth.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.server.nodeEnv === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Serve static files in production
if (config.server.nodeEnv === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
}

// Configure routes
app.use('/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// Simple health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Fallback route for SPA in production
if (config.server.nodeEnv === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
}

// Initialize queue workers
queueService.initWorkers();

// Start the server
const PORT = config.server.port;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${config.server.nodeEnv} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err}`);
    // Don't crash the server in production
    if (config.server.nodeEnv !== 'production') {
        process.exit(1);
    }
});

export default app; 