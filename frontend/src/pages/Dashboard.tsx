import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEmails } from '../contexts/EmailContext';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import EmailAnalysis from '../components/EmailAnalysis';
import Header from '../components/Header';

const Dashboard = () => {
    const { auth } = useAuth();
    const { emailState, fetchEmails } = useEmails();
    const navigate = useNavigate();

    // Redirect if not logged in
    useEffect(() => {
        if (!auth.loading && !auth.isAuthenticated) {
            navigate('/login');
        }
    }, [auth.isAuthenticated, auth.loading, navigate]);

    // Fetch emails on mount
    useEffect(() => {
        if (auth.isAuthenticated) {
            fetchEmails();
        }
    }, [auth.isAuthenticated, fetchEmails]);

    // Show loading state
    if (auth.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    Email Dashboard
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Email list - 4 columns on large screens */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-semibold mb-4">Your Emails</h2>
                            <EmailList
                                emails={emailState.emails}
                                loading={emailState.loading}
                                error={emailState.error}
                            />
                        </div>
                    </div>

                    {/* Email detail - 5 columns on large screens */}
                    <div className="lg:col-span-5">
                        {emailState.selectedEmail ? (
                            <EmailDetail
                                email={emailState.selectedEmail}
                                loading={emailState.loading}
                            />
                        ) : (
                            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center h-full">
                                <p className="text-gray-500">
                                    Select an email to view its contents
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Email analysis - 3 columns on large screens */}
                    <div className="lg:col-span-3">
                        {emailState.analysis ? (
                            <EmailAnalysis analysis={emailState.analysis} />
                        ) : (
                            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center h-full">
                                <p className="text-gray-500">
                                    {emailState.selectedEmail
                                        ? "Click 'Analyze' to view AI insights"
                                        : "Select an email to enable analysis"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 