import express from 'express';
import passport from 'passport';
import logger from '../utils/logger';
import queueService from '../services/queue/queue-service';
import { User } from '../types';

const router = express.Router();

/**
 * @route   GET /auth/google
 * @desc    Authenticate with Google
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']
}));

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            // Start email processing for user
            if (req.user) {
                const user = req.user as User;
                logger.info(`User authenticated: ${user.email}`);
                await queueService.scheduleEmailFetch(user);
            }

            res.redirect('/dashboard');
        } catch (error) {
            logger.error(`Error in Google callback: ${error}`);
            res.redirect('/error');
        }
    }
);

/**
 * @route   GET /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.get('/logout', (req, res) => {
    try {
        if (req.user) {
            const user = req.user as User;
            logger.info(`User logging out: ${user.email}`);

            // Cancel scheduled jobs
            queueService.removeUserJobs(user.id);

            // Clear session
            req.logout(() => {
                logger.debug('User session ended');
                res.redirect('/');
            });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        logger.error(`Error in logout: ${error}`);
        res.redirect('/error');
    }
});

/**
 * @route   GET /auth/status
 * @desc    Get authentication status
 * @access  Public
 */
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        const user = req.user as User;
        res.json({
            isAuthenticated: true,
            user: {
                id: user.id,
                displayName: user.displayName,
                email: user.email,
                provider: user.provider,
            },
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

export default router; 