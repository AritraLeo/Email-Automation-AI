import { Queue, Worker, Job, QueueScheduler } from 'bullmq';
import redisClient from '../../utils/redis';
import logger from '../../utils/logger';
import config from '../../config';
import openAIService from '../ai/openai-service';
import gmailService from '../email/gmail-service';
import { Email, AIAnalysisResult, User } from '../../types';

// Queue names
const EMAIL_FETCH_QUEUE = 'email-fetch';
const EMAIL_ANALYSIS_QUEUE = 'email-analysis';
const EMAIL_RESPONSE_QUEUE = 'email-response';

// Queue connection config
const connection = {
    connection: redisClient,
};

// Initialize queues
const emailFetchQueue = new Queue(EMAIL_FETCH_QUEUE, connection);
const emailAnalysisQueue = new Queue(EMAIL_ANALYSIS_QUEUE, connection);
const emailResponseQueue = new Queue(EMAIL_RESPONSE_QUEUE, connection);

// Initialize queue schedulers
const emailFetchScheduler = new QueueScheduler(EMAIL_FETCH_QUEUE, connection);
const emailAnalysisScheduler = new QueueScheduler(EMAIL_ANALYSIS_QUEUE, connection);
const emailResponseScheduler = new QueueScheduler(EMAIL_RESPONSE_QUEUE, connection);

class QueueService {
    /**
     * Initialize all workers
     */
    initWorkers() {
        this.setupEmailFetchWorker();
        this.setupEmailAnalysisWorker();
        this.setupEmailResponseWorker();

        logger.info('Queue workers initialized');
    }

    /**
     * Schedule email fetching for a user
     * @param user User to fetch emails for
     */
    async scheduleEmailFetch(user: User) {
        try {
            logger.debug(`Scheduling email fetch for user: ${user.email}`);

            // Add job to the queue
            await emailFetchQueue.add('fetch', { userId: user.id, user }, {
                repeat: {
                    every: config.email.fetchInterval,
                },
                removeOnComplete: true,
                removeOnFail: 1000, // Keep failed jobs for debugging
            });

            logger.info(`Email fetch scheduled for user: ${user.email}`);
        } catch (error) {
            logger.error(`Error scheduling email fetch: ${error}`);
        }
    }

    /**
     * Process an email for analysis
     * @param email Email to analyze
     * @param user User who owns the email
     */
    async scheduleEmailAnalysis(email: Email, user: User) {
        try {
            logger.debug(`Scheduling analysis for email: ${email.id}`);

            // Add job to the queue
            await emailAnalysisQueue.add('analyze', { email, user }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: 1000,
            });

            logger.info(`Analysis scheduled for email: ${email.id}`);
        } catch (error) {
            logger.error(`Error scheduling email analysis: ${error}`);
        }
    }

    /**
     * Schedule an email response
     * @param email Original email
     * @param analysis Email analysis results
     * @param user User who owns the email
     */
    async scheduleEmailResponse(email: Email, analysis: AIAnalysisResult, user: User) {
        try {
            logger.debug(`Scheduling response for email: ${email.id}`);

            // Only schedule response for high priority emails
            if (analysis.priority === 'high') {
                await emailResponseQueue.add('respond', { email, analysis, user }, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: true,
                    removeOnFail: 1000,
                });

                logger.info(`Response scheduled for high-priority email: ${email.id}`);
            } else {
                logger.info(`Skipping response for non-high-priority email: ${email.id}`);
            }
        } catch (error) {
            logger.error(`Error scheduling email response: ${error}`);
        }
    }

    /**
     * Remove scheduled jobs for a user
     * @param userId User ID
     */
    async removeUserJobs(userId: string) {
        try {
            logger.debug(`Removing scheduled jobs for user: ${userId}`);

            const jobs = await emailFetchQueue.getRepeatableJobs();
            for (const job of jobs) {
                if (job.name === 'fetch' && job.id.includes(userId)) {
                    await emailFetchQueue.removeRepeatableByKey(job.key);
                }
            }

            logger.info(`Removed scheduled jobs for user: ${userId}`);
        } catch (error) {
            logger.error(`Error removing user jobs: ${error}`);
        }
    }

    /**
     * Setup worker for email fetching
     */
    private setupEmailFetchWorker() {
        const worker = new Worker(EMAIL_FETCH_QUEUE, async (job: Job) => {
            try {
                const { user } = job.data;
                logger.debug(`Processing email fetch job for user: ${user.email}`);

                // Fetch emails
                const emails = await gmailService.fetchEmails(user);

                // Schedule analysis for each email
                for (const email of emails) {
                    await this.scheduleEmailAnalysis(email, user);
                }

                return { success: true, emailsProcessed: emails.length };
            } catch (error) {
                logger.error(`Error in email fetch worker: ${error}`);
                throw error;
            }
        }, connection);

        worker.on('completed', (job) => {
            logger.info(`Email fetch job completed: ${job.id}`);
        });

        worker.on('failed', (job, error) => {
            logger.error(`Email fetch job failed: ${job?.id}, Error: ${error.message}`);
        });
    }

    /**
     * Setup worker for email analysis
     */
    private setupEmailAnalysisWorker() {
        const worker = new Worker(EMAIL_ANALYSIS_QUEUE, async (job: Job) => {
            try {
                const { email, user } = job.data;
                logger.debug(`Processing email analysis job for email: ${email.id}`);

                // Analyze email
                const analysis = await openAIService.analyzeEmail(email);

                // Schedule response if needed
                await this.scheduleEmailResponse(email, analysis, user);

                return { success: true, emailId: email.id, analysis };
            } catch (error) {
                logger.error(`Error in email analysis worker: ${error}`);
                throw error;
            }
        }, connection);

        worker.on('completed', (job) => {
            logger.info(`Email analysis job completed: ${job.id}`);
        });

        worker.on('failed', (job, error) => {
            logger.error(`Email analysis job failed: ${job?.id}, Error: ${error.message}`);
        });
    }

    /**
     * Setup worker for email response
     */
    private setupEmailResponseWorker() {
        const worker = new Worker(EMAIL_RESPONSE_QUEUE, async (job: Job) => {
            try {
                const { email, analysis, user } = job.data;
                logger.debug(`Processing email response job for email: ${email.id}`);

                // Generate response
                const responseText = await openAIService.generateResponse(email, analysis);

                // Send response
                await gmailService.sendReply(user, email, responseText);

                // Mark email as read
                await gmailService.markAsRead(user, email.id);

                return { success: true, emailId: email.id };
            } catch (error) {
                logger.error(`Error in email response worker: ${error}`);
                throw error;
            }
        }, connection);

        worker.on('completed', (job) => {
            logger.info(`Email response job completed: ${job.id}`);
        });

        worker.on('failed', (job, error) => {
            logger.error(`Email response job failed: ${job?.id}, Error: ${error.message}`);
        });
    }
}

export default new QueueService(); 