export interface User {
    id: string;
    displayName: string;
    email: string;
    provider: 'google' | 'outlook';
}

export interface Email {
    id: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    date: Date;
    isRead: boolean;
    labels?: string[];
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    filename: string;
    contentType: string;
    size: number;
}

export interface AIAnalysisResult {
    category: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    priority: 'high' | 'medium' | 'low';
    summary: string;
    keywords: string[];
    suggestedResponse?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface EmailState {
    emails: Email[];
    selectedEmail: Email | null;
    analysis: AIAnalysisResult | null;
    loading: boolean;
    error: string | null;
} 