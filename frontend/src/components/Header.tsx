import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { auth, logout } = useAuth();

    return (
        <header className="bg-white shadow">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-blue-600">
                        Email Automation AI
                    </h1>
                </div>

                {auth.isAuthenticated && auth.user && (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {auth.user.displayName}
                            </p>
                            <p className="text-xs text-gray-600">
                                {auth.user.email}
                            </p>
                        </div>

                        <button
                            onClick={() => logout()}
                            className="btn btn-secondary text-sm"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header; 