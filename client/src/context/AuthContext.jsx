import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    fetchSession,
    loginUser,
    loginWithGoogle,
    registerUser,
    requestOtp
} from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "student-community-auth";

export function AuthProvider({ children }) {
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);

    useEffect(() => {
        const storedSession = window.localStorage.getItem(STORAGE_KEY);

        if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            setToken(parsedSession.token);
            setUser(parsedSession.user);
        }

        setIsBootstrapping(false);
    }, []);

    useEffect(() => {
        if (isBootstrapping) {
            return;
        }

        if (token && user) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
            return;
        }

        window.localStorage.removeItem(STORAGE_KEY);
    }, [isBootstrapping, token, user]);

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        const restoreSession = async () => {
            try {
                const session = await fetchSession(token);
                if (isMounted) {
                    setUser(session.user);
                }
            } catch (error) {
                if (isMounted) {
                    setToken("");
                    setUser(null);
                }
            }
        };

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleAuthSuccess = (response) => {
        setToken(response.token);
        setUser(response.user);
        return response;
    };

    const value = useMemo(
        () => ({
            token,
            user,
            isBootstrapping,
            isAuthenticated: Boolean(token && user),
            async requestOtp(payload) {
                return requestOtp(payload);
            },
            async login(credentials) {
                const response = await loginUser(credentials);
                return handleAuthSuccess(response);
            },
            async register(details) {
                const response = await registerUser(details);
                return handleAuthSuccess(response);
            },
            async googleLogin(idToken) {
                const response = await loginWithGoogle(idToken);
                return handleAuthSuccess(response);
            },
            updateUser(nextUser) {
                setUser(nextUser);
            },
            logout() {
                setToken("");
                setUser(null);
            }
        }),
        [isBootstrapping, token, user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}