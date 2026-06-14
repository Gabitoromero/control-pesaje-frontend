import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { 
  LayoutDashboard, FileBarChart, LogOut, Package, Users, Factory, 
  Layers, Route as RouteIcon, GitMerge, ChevronDown, ChevronRight, Settings 
} from 'lucide-react';
import { UsuarioRol } from '../../shared/types';

export interface SidebarProps {
  onNavClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isGestionOpen, setIsGestionOpen] = useState(() => {
    return ['/articulos', '/etapas', '/lineas', '/rutas', '/usuarios']
      .some(path => location.pathname.includes(path));
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rol = user?.rol;
  const isAdmin = rol === UsuarioRol.ADMINISTRADOR;
  const isJefe = rol === UsuarioRol.JEFE || isAdmin;
  const isVisualizacion = rol === UsuarioRol.VISUALIZACION;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2.5 rounded-md transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const handleLinkClick = () => {
    if (onNavClick) {
      onNavClick();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0 h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Control de Pesaje</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        <NavLink to="/dashboard" end className={navClass} onClick={handleLinkClick}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Monitoreo
        </NavLink>

        {isJefe && (
          <NavLink to="/dashboard/planta" className={navClass} onClick={handleLinkClick}>
            <Factory className="w-5 h-5 mr-3" />
            Planta
          </NavLink>
        )}

        {isJefe && (
          <div>
            <button
              onClick={() => setIsGestionOpen(!isGestionOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-3" />
                Gestión
              </div>
              {isGestionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isGestionOpen && (
              <div className="mt-1 ml-6 space-y-1">
                <NavLink to="/dashboard/articulos" className={navClass} onClick={handleLinkClick}>
                  <Package className="w-5 h-5 mr-3" />
                  Artículos
                </NavLink>
                <NavLink to="/dashboard/etapas" className={navClass} onClick={handleLinkClick}>
                  <Layers className="w-5 h-5 mr-3" />
                  Etapas
                </NavLink>
                <NavLink to="/dashboard/lineas" className={navClass} onClick={handleLinkClick}>
                  <GitMerge className="w-5 h-5 mr-3" />
                  Líneas
                </NavLink>
                <NavLink to="/dashboard/rutas" className={navClass} onClick={handleLinkClick}>
                  <RouteIcon className="w-5 h-5 mr-3" />
                  Rutas
                </NavLink>
                {isAdmin && (
                  <NavLink to="/dashboard/usuarios" className={navClass} onClick={handleLinkClick}>
                    <Users className="w-5 h-5 mr-3" />
                    Usuarios
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {!isVisualizacion && (
          <NavLink to="/dashboard/reportes" className={navClass} onClick={handleLinkClick}>
            <FileBarChart className="w-5 h-5 mr-3" />
            Reportes
          </NavLink>
        )}
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
  );
};
