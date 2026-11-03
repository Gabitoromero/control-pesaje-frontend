import React, { useRef, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { useAuth } from '../features/auth/context/AuthContext';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from '../components/ui/Sidebar';
import { UsuarioRol } from '../shared/types';
import { UnassignedDeviceBanner } from '../features/dashboard/components/UnassignedDeviceBanner';
import { useSidebarOpen } from './useSidebarOpen';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, activeLineaId, closeLineSession } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const [sidebarOpen, toggleSidebar] = useSidebarOpen();

  // Close any orphaned line session when entering the dashboard from the
  // tablet flow (e.g., browser back button). The tablet flow uses
  // replace:true so the selection page is never in history — pressing
  // back lands here with the backend session still alive.
  const orphanedSessionId = useRef(activeLineaId);
  useEffect(() => {
    if (orphanedSessionId.current) {
      closeLineSession();
    }
  }, [closeLineSession]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Restrict to Supervisor/Admin roles
  if (user?.rol === 'operario') {
    return <Navigate to="/tablet" replace />;
  }

  const isAdmin = user?.rol === UsuarioRol.ADMINISTRADOR;
  const isJefe = user?.rol === UsuarioRol.JEFE || isAdmin;

  const openDrawer = () => {
    dialogRef.current?.showModal();
  };

  const closeDrawer = () => {
    dialogRef.current?.close();
  };

  return (
    <MotionConfig reducedMotion="user">
    <div
      className="grid h-screen w-screen bg-background font-sans overflow-hidden grid-cols-1 md:grid-cols-[var(--sidebar-w)_1fr] md:transition-[grid-template-columns] md:duration-300 md:ease-out grid-rows-[auto_1fr] md:grid-rows-1"
      style={{ '--sidebar-w': sidebarOpen ? '16rem' : '3rem' } as React.CSSProperties}
    >
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

      {/* Desktop Sidebar (Persistent, can be hidden down to a slim handle) */}
      <div className="hidden md:block relative h-full col-start-1 col-span-1 row-start-1 row-span-1 overflow-hidden bg-card border-r border-border">
        <div
          inert={!sidebarOpen}
          className={`h-full w-64 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <Sidebar onToggleCollapse={toggleSidebar} />
        </div>
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-3 left-1.5 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Mostrar menú"
            title="Mostrar menú"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
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
        </div>
      </dialog>

      {/* Main Content: each page fades/slides in on navigation */}
      <main className="flex-1 overflow-auto bg-background col-start-1 md:col-start-2 row-start-2 md:row-start-1 h-full relative" style={{ containerType: 'inline-size' }}>
        <motion.div
          key={location.pathname}
          className="p-4 md:p-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {isJefe && <UnassignedDeviceBanner />}
    </div>
    </MotionConfig>
  );
};
