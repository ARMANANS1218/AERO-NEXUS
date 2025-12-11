import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PublicRouter = () => {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // Check if token is expired
            if (decoded.exp && decoded.exp < currentTime) {
                localStorage.removeItem('token');
                return <Outlet />;
            }

            // Redirect based on role
            const roleRoutes = {
                Admin: '/admin',
                Agent: '/agent',
                QA: '/qa',
                Customer: '/customer',
            };

            const redirectPath = roleRoutes[decoded.role];
            if (redirectPath) {
                return <Navigate to={redirectPath} replace />;
            }
            // If role is unknown, clear token and show login
            localStorage.removeItem('token');
            return <Outlet />;
        } catch (error) {
            localStorage.removeItem('token');
            return <Outlet />;
        }
    }
    
    return <Outlet />;
};

export default PublicRouter;