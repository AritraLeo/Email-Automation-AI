import axios from 'axios';
import { Email, AIAnalysisResult } from '../types';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true, // Important for cookies/session
});

// Auth API
export const authAPI = {
    // Get current authentication status
    getStatus: async () => {
        const response = await api.get('/auth/status');
        return response.data;
    },

    // Login with Google (redirects to Google)
    loginWithGoogle: () => {
        window.location.href = 'http://localhost:3000/auth/google';
    },

    // Logout user
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    },
};

// Emails API
export const emailsAPI = {
    // Get all emails
    getEmails: async (): Promise<Email[]> => {
        const response = await api.get('/api/emails');

        // Convert date strings to Date objects
        const emails = response.data.map((email: any) => ({
            ...email,
            date: new Date(email.date),
        }));

        return emails;
    },

    // Analyze an email
    analyzeEmail: async (emailId: string): Promise<AIAnalysisResult> => {
        const response = await api.post(`/api/emails/${emailId}/analyze`);
        return response.data;
    },

    // Reply to an email
    replyToEmail: async (emailId: string, customReply?: string) => {
        const response = await api.post(`/api/emails/${emailId}/reply`, {
            customReply
        });
        return response.data;
    },

    // Mark email as read
    markAsRead: async (emailId: string) => {
        const response = await api.post(`/api/emails/${emailId}/read`);
        return response.data;
    },
};

export default api; 