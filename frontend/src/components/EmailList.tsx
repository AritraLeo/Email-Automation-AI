import { useEmails } from '../contexts/EmailContext';
import { Email } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface EmailListProps {
    emails: Email[];
    loading: boolean;
    error: string | null;
}

const EmailList = ({ emails, loading, error }: EmailListProps) => {
    const { selectEmail } = useEmails();

    // Format date to readable format
    const formatDate = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true });
    };

    if (loading) {
        return (
            <div className="py-4 text-center">
                <div className="animate-spin inline-block rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Loading emails...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-gray-600">No emails found</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {emails.map((email) => (
                <div
                    key={email.id}
                    onClick={() => selectEmail(email)}
                    className={`py-3 px-2 cursor-pointer hover:bg-gray-50 transition-colors ${!email.isRead ? 'bg-blue-50' : ''
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="font-medium truncate pr-2">
                            {email.from.split('<')[0].trim()}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(email.date)}
                        </div>
                    </div>

                    <div className="text-sm font-medium truncate mt-1">
                        {email.subject}
                    </div>

                    <div className="text-xs text-gray-600 truncate mt-1">
                        {email.body.substring(0, 100).replace(/<[^>]*>?/gm, '')}...
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EmailList; 