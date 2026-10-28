import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { PlantaModeSwitch } from '../features/tablet/components/PlantaModeSwitch';

export const TabletLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col font-sans select-none touch-none">
      <PlantaModeSwitch />
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
};
