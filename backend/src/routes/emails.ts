import express from 'express';
import { isAuthenticated, hasValidToken } from '../middleware/auth';
import logger from '../utils/logger';
import gmailService from '../services/email/gmail-service';
import openAIService from '../services/ai/openai-service';
import { User } from '../types';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);
router.use(hasValidToken);

/**
 * @route   GET /api/emails
 * @desc    Get emails for authenticated user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const user = req.user as User;
        logger.debug(`Fetching emails for user: ${user.email}`);

        const emails = await gmailService.fetchEmails(user);
        res.json(emails);
    } catch (error) {
        logger.error(`Error fetching emails: ${error}`);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

/**
 * @route   POST /api/emails/:id/analyze
 * @desc    Analyze a specific email
 * @access  Private
 */
router.post('/:id/analyze', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user as User;
        logger.debug(`Manually analyzing email ${id} for user: ${user.email}`);

        // Fetch the specific email first
        const emails = await gmailService.fetchEmails(user);
        const email = emails.find(e => e.id === id);

        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // Analyze the email
        const analysis = await openAIService.analyzeEmail(email);
        res.json(analysis);
    } catch (error) {
        logger.error(`Error analyzing email: ${error}`);
        res.status(500).json({ error: 'Failed to analyze email' });
    }
});

/**
 * @route   POST /api/emails/:id/reply
 * @desc    Generate and send a reply to an email
 * @access  Private
 */
router.post('/:id/reply', async (req, res) => {
    try {
        const { id } = req.params;
        const { customReply } = req.body;
        const user = req.user as User;
        logger.debug(`Generating reply for email ${id} for user: ${user.email}`);

        // Fetch the specific email first
        const emails = await gmailService.fetchEmails(user);
        const email = emails.find(e => e.id === id);

        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }

        let replyText: string;

        if (customReply) {
            // Use custom reply provided by user
            replyText = customReply;
        } else {
            // Analyze the email first
            const analysis = await openAIService.analyzeEmail(email);

            // Generate automatic reply
            replyText = await openAIService.generateResponse(email, analysis);
        }

        // Send the reply
        await gmailService.sendReply(user, email, replyText);

        // Mark as read
        await gmailService.markAsRead(user, id);

        res.json({ success: true, message: 'Reply sent successfully' });
    } catch (error) {
        logger.error(`Error sending reply: ${error}`);
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

/**
 * @route   POST /api/emails/:id/read
 * @desc    Mark an email as read
 * @access  Private
 */
router.post('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user as User;
        logger.debug(`Marking email ${id} as read for user: ${user.email}`);

        const success = await gmailService.markAsRead(user, id);

        if (success) {
            res.json({ success: true, message: 'Email marked as read' });
        } else {
            res.status(500).json({ error: 'Failed to mark email as read' });
        }
    } catch (error) {
        logger.error(`Error marking email as read: ${error}`);
        res.status(500).json({ error: 'Failed to mark email as read' });
    }
});

export default router; 