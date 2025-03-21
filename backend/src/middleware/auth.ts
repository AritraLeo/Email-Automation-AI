import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }

    logger.debug('Unauthorized access attempt - redirecting to login');
    res.status(401).json({ error: 'Unauthorized' });
};

/**
 * Middleware to check if user is authenticated with specific provider
 */
export const hasProvider = (provider: 'google' | 'outlook') => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.isAuthenticated() && req.user?.provider === provider) {
            return next();
        }

        logger.debug(`User lacks ${provider} authentication - access denied`);
        res.status(403).json({ error: `You need to authenticate with ${provider}` });
    };
};

/**
 * Middleware to check for valid access token (not expired)
 */
export const hasValidToken = (req: Request, res: Response, next: NextFunction) => {
    if (
        req.isAuthenticated() &&
        req.user?.accessToken &&
        (!req.user?.tokenExpiry || new Date(req.user.tokenExpiry) > new Date())
    ) {
        return next();
    }

    logger.debug('User token expired or invalid - redirecting to refresh');
    res.status(401).json({ error: 'Your session has expired. Please login again.' });
}; 