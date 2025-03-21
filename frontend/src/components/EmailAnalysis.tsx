import { AIAnalysisResult } from '../types';

interface EmailAnalysisProps {
    analysis: AIAnalysisResult;
}

const EmailAnalysis = ({ analysis }: EmailAnalysisProps) => {
    // Helper function to get color based on priority
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    // Helper function to get color based on sentiment
    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return 'text-green-600 bg-green-50';
            case 'negative':
                return 'text-red-600 bg-red-50';
            case 'neutral':
            default:
                return 'text-blue-600 bg-blue-50';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-1">AI Analysis</h2>
                <p className="text-sm text-gray-600">Insights from the email content</p>
            </div>

            <div className="p-6 space-y-4">
                {/* Category */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Category</h3>
                    <p className="text-gray-900 font-medium mt-1">{analysis.category}</p>
                </div>

                {/* Priority */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Priority</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getPriorityColor(analysis.priority)}`}>
                        {analysis.priority}
                    </span>
                </div>

                {/* Sentiment */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Sentiment</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getSentimentColor(analysis.sentiment)}`}>
                        {analysis.sentiment}
                    </span>
                </div>

                {/* Summary */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Summary</h3>
                    <p className="text-gray-800 mt-1">{analysis.summary}</p>
                </div>

                {/* Keywords */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Keywords</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {analysis.keywords.map((keyword, index) => (
                            <span key={index} className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Suggested Response */}
                {analysis.suggestedResponse && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Suggested Response</h3>
                        <div className="mt-1 p-3 bg-gray-50 rounded text-sm text-gray-800 border border-gray-200">
                            {analysis.suggestedResponse}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailAnalysis; 