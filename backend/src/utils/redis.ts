import IORedis from 'ioredis';
import config from '../config';
import logger from './logger';

// Create Redis connection
const redisClient = new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

// Handle Redis connection events
redisClient.on('connect', () => {
    logger.info('Redis connection established');
});

redisClient.on('error', (error) => {
    logger.error(`Redis connection error: ${error.message}`);
});

redisClient.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
});

export default redisClient; 