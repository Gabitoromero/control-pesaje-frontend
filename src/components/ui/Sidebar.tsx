import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { 
  LayoutDashboard, FileBarChart, LogOut, Package, Users, Factory, 
  Layers, Route as RouteIcon, GitMerge, ChevronDown, ChevronRight, Settings, Activity, Cpu 
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
    return ['/articulos', '/etapas', '/lineas', '/rutas', '/usuarios', '/sesiones-activas', '/dispositivos-conectados']
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
        ? 'bg-brand-muted text-brand font-medium'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  const handleLinkClick = () => {
    if (onNavClick) {
      onNavClick();
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm flex-shrink-0 h-full">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Control de Pesaje</h1>
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-foreground`}
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
                  <>
                    <NavLink to="/dashboard/usuarios" className={navClass} onClick={handleLinkClick}>
                      <Users className="w-5 h-5 mr-3" />
                      Usuarios
                    </NavLink>
                    <NavLink to="/dashboard/sesiones-activas" className={navClass} onClick={handleLinkClick}>
                      <Activity className="w-5 h-5 mr-3" />
                      Sesiones Activas
                    </NavLink>
                    <NavLink to="/dashboard/dispositivos-conectados" className={navClass} onClick={handleLinkClick}>
                      <Cpu className="w-5 h-5 mr-3" />
                      Dispositivos
                    </NavLink>
                  </>
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

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user?.nombreUsuario}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.rol}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
