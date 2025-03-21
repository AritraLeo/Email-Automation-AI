import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index';
import logger from '../utils/logger';
import { User } from '../types';

// Configure Passport.js
export default function configurePassport() {
    // Serialize user to store in session
    passport.serializeUser((user: User, done) => {
        done(null, user);
    });

    // Deserialize user from session
    passport.deserializeUser((user: User, done) => {
        done(null, user);
    });

    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.auth.google.clientId,
                clientSecret: config.auth.google.clientSecret,
                callbackURL: config.auth.google.callbackUrl,
                scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // In a real application, you'd save this to a database
                    const user: User = {
                        id: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails?.[0]?.value || '',
                        provider: 'google',
                        accessToken,
                        refreshToken,
                        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour from now
                    };

                    logger.debug(`User authenticated via Google: ${user.email}`);
                    return done(null, user);
                } catch (error) {
                    logger.error(`Google authentication error: ${error}`);
                    return done(error as Error);
                }
            }
        )
    );

    // Outlook OAuth Strategy would be added here in a similar way

    return passport;
} 