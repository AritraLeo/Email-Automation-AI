import { useState } from 'react';
import { Email } from '../types';
import { format } from 'date-fns';
import { useEmails } from '../contexts/EmailContext';

interface EmailDetailProps {
    email: Email;
    loading: boolean;
}

const EmailDetail = ({ email, loading }: EmailDetailProps) => {
    const { analyzeEmail, replyToEmail, markAsRead } = useEmails();
    const [replyText, setReplyText] = useState('');
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleAnalyze = async () => {
        await analyzeEmail(email.id);
        // Mark as read when analyzing
        if (!email.isRead) {
            await markAsRead(email.id);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;

        setSubmitting(true);
        try {
            await replyToEmail(email.id, replyText);
            setReplyText('');
            setShowReplyForm(false);
        } catch (error) {
            console.error('Error sending reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoReply = async () => {
        setSubmitting(true);
        try {
            await replyToEmail(email.id); // No custom reply means use AI
            setShowReplyForm(false);
        } catch (error) {
            console.error('Error sending auto-reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Email header */}
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold mb-2">{email.subject}</h2>

                <div className="flex items-center justify-between text-sm">
                    <div>
                        <p className="font-medium">From: {email.from}</p>
                        <p className="text-gray-600">
                            To: {email.to.join(', ')}
                        </p>
                        {email.cc && email.cc.length > 0 && (
                            <p className="text-gray-600">
                                CC: {email.cc.join(', ')}
                            </p>
                        )}
                    </div>

                    <p className="text-gray-500">
                        {format(email.date, 'PPP p')}
                    </p>
                </div>
            </div>

            {/* Email body */}
            <div className="p-6 text-gray-700 max-h-[300px] overflow-y-auto">
                {/* For HTML emails, we could use dangerouslySetInnerHTML, but for security we'll just show plain text */}
                <div className="whitespace-pre-wrap break-words">
                    {email.body}
                </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 flex-wrap">
                <button
                    onClick={handleAnalyze}
                    className="btn btn-primary"
                >
                    Analyze
                </button>

                <button
                    onClick={() => setShowReplyForm(prev => !prev)}
                    className="btn btn-secondary"
                >
                    {showReplyForm ? 'Cancel Reply' : 'Reply'}
                </button>

                <button
                    onClick={handleAutoReply}
                    className="btn bg-green-600 text-white hover:bg-green-700"
                    disabled={submitting}
                >
                    Auto-Reply with AI
                </button>
            </div>

            {/* Reply form */}
            {showReplyForm && (
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply here..."
                        className="input h-32 mb-4"
                        disabled={submitting}
                    ></textarea>

                    <button
                        onClick={handleReply}
                        className="btn btn-primary"
                        disabled={!replyText.trim() || submitting}
                    >
                        {submitting ? 'Sending...' : 'Send Reply'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailDetail; 