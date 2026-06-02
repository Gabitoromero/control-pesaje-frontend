import React from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { LayoutDashboard, FileBarChart, LogOut, Package } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Restrict to Supervisor/Admin roles
  if (user?.rol === 'operario') {
    return <Navigate to="/tablet" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Control de Pesaje</h1>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Monitoreo en vivo
          </NavLink>

          <NavLink
            to="/dashboard/articulos"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Package className="w-5 h-5 mr-3" />
            Artículos
          </NavLink>

          <NavLink
            to="/dashboard/reportes"
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <FileBarChart className="w-5 h-5 mr-3" />
            Reportes
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{user?.nombreUsuario}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.rol}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
