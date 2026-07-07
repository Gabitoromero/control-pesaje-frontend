import React, { useRef } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '../components/ui/Sidebar';
import { UnassignedDeviceBanner } from '../features/dashboard/components/UnassignedDeviceBanner';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Restrict to Supervisor/Admin roles
  if (user?.rol === 'operario') {
    return <Navigate to="/tablet" replace />;
  }

  const openDrawer = () => {
    dialogRef.current?.showModal();
  };

  const closeDrawer = () => {
    dialogRef.current?.close();
  };

  return (
    <div className="grid h-screen w-screen bg-background font-sans overflow-hidden grid-cols-1 md:grid-cols-[16rem_1fr] grid-rows-[auto_1fr] md:grid-rows-1">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-card border-b border-border shadow-sm col-span-1">
        <h1 className="text-xl font-bold text-foreground">Control de Pesaje</h1>
        <button
          onClick={openDrawer}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden md:block h-full col-start-1 col-span-1 row-start-1 row-span-1">
        <Sidebar />
      </div>

      {/* Mobile Navigation Drawer */}
      <dialog 
        ref={dialogRef}
        className="md:hidden p-0 m-0 h-full max-h-screen w-64 backdrop:bg-black/50 open:flex flex-col border-none shadow-xl transform transition-transform"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDrawer();
        }}
      >
        <div className="flex-1 overflow-hidden relative">
          <Sidebar onNavClick={closeDrawer} />
          {/* Close Button overlayed inside the drawer if needed, though Sidebar handles it. 
              Let's add a close button inside the drawer just in case */}
          <button
            onClick={closeDrawer}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </dialog>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background col-start-1 md:col-start-2 row-start-2 md:row-start-1 h-full" style={{ containerType: 'inline-size' }}>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      
      {/* Unassigned Device Banner */}
      <UnassignedDeviceBanner />
    </div>
  );
};
