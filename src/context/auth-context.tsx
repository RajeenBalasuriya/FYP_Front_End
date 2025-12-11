import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
    email: string;
    sub: number | string;
    userName: string;
    iat: number;
    exp: number;
}

interface AuthContextType {
    user: User | null;
    register: (data: any) => Promise<void>;
    login: (data: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = parseJwt(token);
                setUser(decoded);
            } catch (error) {
                console.error("Invalid token found", error);
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const register = async (data: any) => {
        const response = await api.post<{ access_token: string }>('/auth/register', data);

        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            const decoded = parseJwt(response.data.access_token);
            setUser(decoded);
        }
    };

    const login = async (data: any) => {
        const response = await api.post<{ access_token: string }>('/auth/login', data);

        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            const decoded = parseJwt(response.data.access_token);
            setUser(decoded);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, register, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
