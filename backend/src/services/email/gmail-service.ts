import axios from 'axios';
import logger from '../../utils/logger';
import { Email, Attachment, User } from '../../types';

class GmailService {
    private baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me';

    /**
     * Fetch emails from Gmail API
     * @param user Authenticated user with access token
     * @param maxResults Maximum number of emails to fetch
     * @returns Array of emails
     */
    async fetchEmails(user: User, maxResults = 10): Promise<Email[]> {
        try {
            logger.debug(`Fetching emails for user: ${user.email}`);

            // Get list of message IDs
            const messagesResponse = await axios.get(`${this.baseUrl}/messages`, {
                params: {
                    maxResults,
                    q: 'is:unread', // Only fetch unread emails
                },
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                },
            });

            if (!messagesResponse.data.messages || messagesResponse.data.messages.length === 0) {
                logger.info('No unread emails found');
                return [];
            }

            // Fetch full message details for each ID
            const emails: Email[] = [];
            for (const message of messagesResponse.data.messages) {
                const emailData = await this.fetchEmailDetails(user, message.id);
                if (emailData) {
                    emails.push(emailData);
                }
            }

            logger.info(`Successfully fetched ${emails.length} emails`);
            return emails;
        } catch (error) {
            logger.error(`Error fetching emails: ${error}`);
            throw new Error(`Failed to fetch emails: ${error}`);
        }
    }

    /**
     * Fetch details for a specific email
     * @param user Authenticated user with access token
     * @param messageId Gmail message ID
     * @returns Email details
     */
    private async fetchEmailDetails(user: User, messageId: string): Promise<Email | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/messages/${messageId}`, {
                params: {
                    format: 'full',
                },
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                },
            });

            const { payload, id, labelIds, internalDate } = response.data;

            // Extract headers
            const headers = this.parseHeaders(payload.headers);

            // Extract email body
            const body = this.parseBody(payload);

            // Extract attachments
            const attachments = this.parseAttachments(payload);

            return {
                id,
                from: headers.from,
                to: headers.to.split(',').map((email: string) => email.trim()),
                cc: headers.cc ? headers.cc.split(',').map((email: string) => email.trim()) : [],
                subject: headers.subject,
                body,
                date: new Date(parseInt(internalDate)),
                isRead: !labelIds.includes('UNREAD'),
                labels: labelIds,
                attachments,
            };
        } catch (error) {
            logger.error(`Error fetching email details: ${error}`);
            return null;
        }
    }

    /**
     * Send a reply to an email
     * @param user Authenticated user with access token
     * @param originalEmail Original email to reply to
     * @param replyBody Reply body content
     * @returns Success status
     */
    async sendReply(user: User, originalEmail: Email, replyBody: string): Promise<boolean> {
        try {
            logger.debug(`Sending reply to email: ${originalEmail.id}`);

            const rawEmail = this.createReplyEmail(originalEmail, replyBody);
            const encodedEmail = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            await axios.post(
                `${this.baseUrl}/messages/send`,
                {
                    raw: encodedEmail,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            logger.info(`Successfully sent reply to email ${originalEmail.id}`);
            return true;
        } catch (error) {
            logger.error(`Error sending reply: ${error}`);
            throw new Error(`Failed to send reply: ${error}`);
        }
    }

    /**
     * Mark an email as read
     * @param user Authenticated user with access token
     * @param messageId Gmail message ID
     * @returns Success status
     */
    async markAsRead(user: User, messageId: string): Promise<boolean> {
        try {
            logger.debug(`Marking email as read: ${messageId}`);

            await axios.post(
                `${this.baseUrl}/messages/${messageId}/modify`,
                {
                    removeLabelIds: ['UNREAD'],
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            logger.info(`Successfully marked email ${messageId} as read`);
            return true;
        } catch (error) {
            logger.error(`Error marking email as read: ${error}`);
            return false;
        }
    }

    /**
     * Parse email headers into an object
     */
    private parseHeaders(headers: Array<{ name: string; value: string }>): Record<string, string> {
        const result: Record<string, string> = {};
        headers.forEach((header) => {
            result[header.name.toLowerCase()] = header.value;
        });
        return result;
    }

    /**
     * Parse email body from payload
     */
    private parseBody(payload: any): string {
        let body = '';

        // Check if the payload has a body
        if (payload.body && payload.body.data) {
            body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } else if (payload.parts) {
            // Look for text/plain or text/html parts
            for (const part of payload.parts) {
                const mimeType = part.mimeType;
                if (mimeType === 'text/plain' && part.body && part.body.data) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    break;
                } else if (mimeType === 'text/html' && part.body && part.body.data) {
                    // Use html content if plain text isn't available
                    if (body === '') {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    }
                }
            }
        }

        return body;
    }

    /**
     * Parse attachments from payload
     */
    private parseAttachments(payload: any): Attachment[] {
        const attachments: Attachment[] = [];

        const extractAttachments = (part: any) => {
            // Check if part is an attachment
            if (
                part.body &&
                part.body.attachmentId &&
                part.filename &&
                part.filename.trim() !== ''
            ) {
                attachments.push({
                    id: part.body.attachmentId,
                    filename: part.filename,
                    contentType: part.mimeType,
                    size: part.body.size || 0,
                });
            }

            // Recursively check parts
            if (part.parts) {
                for (const subpart of part.parts) {
                    extractAttachments(subpart);
                }
            }
        };

        // Start extraction from top-level parts
        if (payload.parts) {
            for (const part of payload.parts) {
                extractAttachments(part);
            }
        }

        return attachments;
    }

    /**
     * Create a raw email reply string
     */
    private createReplyEmail(originalEmail: Email, replyBody: string): string {
        const to = originalEmail.from;
        const subject = `Re: ${originalEmail.subject}`;
        const from = originalEmail.to[0]; // Assuming the first recipient is the current user

        return [
            `From: ${from}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=utf-8',
            'Content-Transfer-Encoding: 7bit',
            'References: <' + originalEmail.id + '@mail.gmail.com>',
            'In-Reply-To: <' + originalEmail.id + '@mail.gmail.com>',
            '',
            replyBody,
            '',
            'On ' + originalEmail.date.toISOString() + ', ' + originalEmail.from + ' wrote:',
            '',
            originalEmail.body
                .split('\n')
                .map(line => '> ' + line)
                .join('\n'),
        ].join('\n');
    }
}

export default new GmailService(); 