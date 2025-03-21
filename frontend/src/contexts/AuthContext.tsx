import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthState, User } from '../types';
import { authAPI } from '../services/api';

// Create context with default values
const AuthContext = createContext<{
    auth: AuthState;
    login: () => void;
    logout: () => Promise<void>;
}>({
    auth: {
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    },
    login: () => { },
    logout: async () => { },
});

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [auth, setAuth] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });

    // Check auth status on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const data = await authAPI.getStatus();

                setAuth({
                    isAuthenticated: data.isAuthenticated,
                    user: data.isAuthenticated ? data.user : null,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setAuth({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: 'Failed to check authentication status',
                });
            }
        };

        checkAuthStatus();
    }, []);

    // Login function
    const login = () => {
        authAPI.loginWithGoogle();
    };

    // Logout function
    const logout = async () => {
        try {
            await authAPI.logout();
            setAuth({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            });
        } catch (error) {
            setAuth(prev => ({
                ...prev,
                error: 'Failed to logout',
            }));
        }
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 