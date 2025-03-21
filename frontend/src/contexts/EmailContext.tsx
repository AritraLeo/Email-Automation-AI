import { createContext, useState, useContext, ReactNode } from 'react';
import { EmailState, Email, AIAnalysisResult } from '../types';
import { emailsAPI } from '../services/api';

// Create context with default values
const EmailContext = createContext<{
    emailState: EmailState;
    fetchEmails: () => Promise<void>;
    selectEmail: (email: Email | null) => void;
    analyzeEmail: (emailId: string) => Promise<void>;
    replyToEmail: (emailId: string, customReply?: string) => Promise<void>;
    markAsRead: (emailId: string) => Promise<void>;
}>({
    emailState: {
        emails: [],
        selectedEmail: null,
        analysis: null,
        loading: false,
        error: null,
    },
    fetchEmails: async () => { },
    selectEmail: () => { },
    analyzeEmail: async () => { },
    replyToEmail: async () => { },
    markAsRead: async () => { },
});

// Email provider component
export const EmailProvider = ({ children }: { children: ReactNode }) => {
    const [emailState, setEmailState] = useState<EmailState>({
        emails: [],
        selectedEmail: null,
        analysis: null,
        loading: false,
        error: null,
    });

    // Fetch emails
    const fetchEmails = async () => {
        try {
            setEmailState(prev => ({ ...prev, loading: true, error: null }));

            const emails = await emailsAPI.getEmails();

            setEmailState(prev => ({
                ...prev,
                emails,
                loading: false,
            }));
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to fetch emails';

            setEmailState(prev => ({
                ...prev,
                loading: false,
                error,
            }));
        }
    };

    // Select an email
    const selectEmail = (email: Email | null) => {
        setEmailState(prev => ({
            ...prev,
            selectedEmail: email,
            analysis: null, // Reset analysis when selecting a new email
        }));
    };

    // Analyze an email
    const analyzeEmail = async (emailId: string) => {
        try {
            setEmailState(prev => ({ ...prev, loading: true, error: null }));

            const analysis = await emailsAPI.analyzeEmail(emailId);

            setEmailState(prev => ({
                ...prev,
                analysis,
                loading: false,
            }));
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to analyze email';

            setEmailState(prev => ({
                ...prev,
                loading: false,
                error,
            }));
        }
    };

    // Reply to an email
    const replyToEmail = async (emailId: string, customReply?: string) => {
        try {
            setEmailState(prev => ({ ...prev, loading: true, error: null }));

            await emailsAPI.replyToEmail(emailId, customReply);

            // Refresh emails after reply
            await fetchEmails();

            // Reset selected email after reply
            setEmailState(prev => ({
                ...prev,
                selectedEmail: null,
                analysis: null,
                loading: false,
            }));
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to send reply';

            setEmailState(prev => ({
                ...prev,
                loading: false,
                error,
            }));
        }
    };

    // Mark email as read
    const markAsRead = async (emailId: string) => {
        try {
            await emailsAPI.markAsRead(emailId);

            // Update local email list to reflect read status
            setEmailState(prev => ({
                ...prev,
                emails: prev.emails.map(email =>
                    email.id === emailId
                        ? { ...email, isRead: true }
                        : email
                ),
            }));
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to mark email as read';

            setEmailState(prev => ({
                ...prev,
                error,
            }));
        }
    };

    return (
        <EmailContext.Provider value={{
            emailState,
            fetchEmails,
            selectEmail,
            analyzeEmail,
            replyToEmail,
            markAsRead
        }}>
            {children}
        </EmailContext.Provider>
    );
};

// Custom hook to use email context
export const useEmails = () => useContext(EmailContext);

export default EmailContext; 