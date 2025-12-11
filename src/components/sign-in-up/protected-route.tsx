import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';

export const ProtectedRoute = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Or a proper spinner
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
