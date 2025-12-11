import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return children;
};

export default SuperAdminRoute;
