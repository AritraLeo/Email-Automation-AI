export interface User {
    id: string;
    displayName: string;
    email: string;
    provider: 'google' | 'outlook';
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
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
    content?: Buffer;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    rules?: CategoryRule[];
}

export interface CategoryRule {
    id: string;
    field: 'from' | 'to' | 'subject' | 'body';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
    value: string;
}

export interface ResponseTemplate {
    id: string;
    name: string;
    categoryId?: string;
    subject: string;
    body: string;
    variables?: string[];
}

export interface AIAnalysisResult {
    category: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    priority: 'high' | 'medium' | 'low';
    summary: string;
    keywords: string[];
    suggestedResponse?: string;
}

export interface QueueJob {
    id: string;
    type: 'email-fetch' | 'email-analysis' | 'email-response';
    data: any;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    error?: string;
} 