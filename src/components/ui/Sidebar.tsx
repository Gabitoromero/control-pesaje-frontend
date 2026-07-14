import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  LayoutDashboard, FileBarChart, LogOut, Package, Users, Factory,
  Layers, Route as RouteIcon, GitMerge, ChevronDown, ChevronRight, Settings, Activity, Cpu, BookOpen, Ban, Sun, Moon, UserCheck
} from 'lucide-react';
import { useTheme } from '../../features/theme/ThemeContext';
import { UsuarioRol } from '../../shared/types';
import { getAvatarInitials } from '../../features/tablet/utils/avatarInitials';

export interface SidebarProps {
  onNavClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [isCatalogoOpen, setIsCatalogoOpen] = useState(() => {
    return ['/articulos', '/etapas', '/lineas', '/rutas']
      .some(path => location.pathname.includes(path));
  });

  const [isAdministracionOpen, setIsAdministracionOpen] = useState(() => {
    return ['/usuarios', '/sesiones-activas', '/dispositivos-conectados', '/pasadas-activas']
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
              onClick={() => setIsCatalogoOpen(!isCatalogoOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-foreground`}
            >
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-3" />
                Catálogo
              </div>
              {isCatalogoOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isCatalogoOpen && (
              <div className="mt-1 ml-6 space-y-1">
                {isAdmin && (
                  <NavLink to="/dashboard/usuarios" className={navClass} onClick={handleLinkClick}>
                    <Users className="w-5 h-5 mr-3" />
                    Usuarios
                  </NavLink>
                )}
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
              </div>
            )}
          </div>
        )}

        {isJefe && (
          <div>
            <button
              onClick={() => setIsAdministracionOpen(!isAdministracionOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-foreground`}
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-3" />
                Administración
              </div>
              {isAdministracionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isAdministracionOpen && (
              <div className="mt-1 ml-6 space-y-1">
                <NavLink to="/dashboard/pasadas-activas" className={navClass} onClick={handleLinkClick}>
                  <Activity className="w-5 h-5 mr-3" />
                  Pasadas Activas
                </NavLink>
                {isAdmin && (
                  <NavLink to="/dashboard/sesiones-activas" className={navClass} onClick={handleLinkClick}>
                    <UserCheck className="w-5 h-5 mr-3" />
                    Sesiones Activas
                  </NavLink>
                )}
                <NavLink to="/dashboard/dispositivos-conectados" className={navClass} onClick={handleLinkClick}>
                  <Cpu className="w-5 h-5 mr-3" />
                  Dispositivos
                </NavLink>
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

        <button
          onClick={toggleTheme}
          className="w-full flex items-center px-3 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
          Cambiar Tema
        </button>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
              {getAvatarInitials(user?.nombreUsuario)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{user?.nombreUsuario}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.rol}</span>
            </div>
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
