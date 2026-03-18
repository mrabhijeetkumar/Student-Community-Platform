import { createContext, useEffect, useMemo, useState } from "react";
import {
    fetchSession,
    loginUser,
    loginWithGoogle,
    registerUser as registerUserApi,
    requestOtp as requestOtpApi,
    requestVerification as requestVerificationApi,
    resendVerification as resendVerificationApi,
    verifyRegistration as verifyRegistrationApi
} from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "student-community-auth";

function readStoredSession() {
    if (typeof window === "undefined") {
        return { token: "", user: null };
    }

    const rawSession = window.localStorage.getItem(STORAGE_KEY);

    if (!rawSession) {
        return { token: "", user: null };
    }

    try {
        const parsedSession = JSON.parse(rawSession);
        return {
            token: parsedSession?.token || "",
            user: parsedSession?.user || null
        };
    } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        return { token: "", user: null };
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);
    const [isBootstrapping, setIsBootstrapping] = useState(true);

    useEffect(() => {
        const storedSession = readStoredSession();

        setToken(storedSession.token);
        setUser(storedSession.user);

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
                return requestOtpApi(payload);
            },
            async requestVerification(payload) {
                return requestVerificationApi(payload);
            },
            async resendVerification(payload) {
                return resendVerificationApi(payload);
            },
            async login(credentials) {
                const response = await loginUser(credentials);
                return handleAuthSuccess(response);
            },
            async register(details) {
                const response = await registerUserApi(details);
                return handleAuthSuccess(response);
            },
            async verifyRegistration(details) {
                const response = await verifyRegistrationApi(details);
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

export { AuthContext };
