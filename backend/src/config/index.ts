import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface Config {
    server: {
        port: number;
        nodeEnv: string;
    };
    auth: {
        google: {
            clientId: string;
            clientSecret: string;
            callbackUrl: string;
        };
        outlook: {
            clientId: string;
            clientSecret: string;
            callbackUrl: string;
        };
        session: {
            secret: string;
        };
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    openai: {
        apiKey: string;
    };
    email: {
        fetchInterval: number;
    };
}

const config: Config = {
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    auth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        },
        outlook: {
            clientId: process.env.OUTLOOK_CLIENT_ID || '',
            clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
            callbackUrl: process.env.OUTLOOK_CALLBACK_URL || 'http://localhost:3000/auth/outlook/callback',
        },
        session: {
            secret: process.env.SESSION_SECRET || 'default_secret',
        },
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },
    email: {
        fetchInterval: parseInt(process.env.EMAIL_FETCH_INTERVAL || '300000', 10),
    },
};

export default config; 