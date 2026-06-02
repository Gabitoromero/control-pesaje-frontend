import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { useBalanzaWebSocket } from '../features/tablet/hooks/useBalanzaWebSocket';
import { WifiOff } from 'lucide-react';

export const TabletLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Only operators/supervisors mapped to a line can use the tablet layout safely
  // For the sake of the MVP, we assume if they are routed here, we try to use user.lineaId.
  const lineaId = user?.lineaId || null;
  const { isConnected } = useBalanzaWebSocket(lineaId);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50 flex flex-col font-sans select-none touch-none">
      {/* Top Navbar / Header for Tablet could go here */}
      <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-800">
          Línea de Producción {lineaId || 'Desconocida'}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-600">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 border-l pl-4 border-gray-300">
            {user?.nombreUsuario}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>

      {/* Disconnection Lockout Overlay (RF-02) */}
      {!isConnected && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <WifiOff className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
          <h2 className="text-4xl font-bold mb-4 text-center">Conexión Perdida</h2>
          <p className="text-xl text-gray-300 text-center max-w-lg">
            Se ha perdido la conexión con la balanza. Por favor, verifique el equipo o contacte a soporte.
            La interfaz está bloqueada por seguridad.
          </p>
        </div>
      )}
    </div>
  );
};
