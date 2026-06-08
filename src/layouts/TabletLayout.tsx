import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export const TabletLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col font-sans select-none touch-none">
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
};
