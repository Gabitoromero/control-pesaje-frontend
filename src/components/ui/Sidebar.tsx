import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  LayoutDashboard, FileBarChart, LogOut, Package, Users, UserRoundCog, Factory,
  Layers, Route as RouteIcon, SplinePointer, ChevronDown, ChevronRight, Cog, Activity, Cpu, Sun, Moon, Radar
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
    return ['/usuarios', '/articulos', '/etapas', '/lineas', '/rutas', '/dispositivos-conectados']
      .some(path => location.pathname.includes(path));
  });

  const [isAdministracionOpen, setIsAdministracionOpen] = useState(() => {
    return ['/sesiones-activas', '/pasadas-activas']
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
      {/* Avatar + logout block (ux-polish Task 2: moved from bottom to top so
          the user is always visible without scrolling the nav). */}
      <div className="p-4 border-b border-border">
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
                <Cog className="w-5 h-5 mr-3" />
                Parametrización
              </div>
              {isCatalogoOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isCatalogoOpen && (
              <div className="mt-1 ml-6 space-y-1">
                {isAdmin && (
                  <NavLink to="/dashboard/usuarios" className={navClass} onClick={handleLinkClick}>
                    <UserRoundCog className="w-5 h-5 mr-3" />
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
                  <SplinePointer className="w-5 h-5 mr-3" />
                  Líneas
                </NavLink>
                <NavLink to="/dashboard/rutas" className={navClass} onClick={handleLinkClick}>
                  <RouteIcon className="w-5 h-5 mr-3" />
                  Rutas
                </NavLink>
                <NavLink to="/dashboard/dispositivos-conectados" className={navClass} onClick={handleLinkClick}>
                  <Cpu className="w-5 h-5 mr-3" />
                  Dispositivos
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
                <Radar className="w-5 h-5 mr-3" />
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
                    <Users className="w-5 h-5 mr-3" />
                    Sesiones Activas
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

        <button
          onClick={toggleTheme}
          className="w-full flex items-center px-3 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
          Tema
        </button>
      </nav>

      <div className="p-4 border-t border-border">
        {/* ux-polish Task 2: title moved to bottom and de-emphasized,
            with a version line below it. */}
        <h1 className="text-sm text-muted-foreground">Control de Pesaje</h1>
        <p className="text-xs text-muted-foreground/60">MaciaSoft v1.0</p>
      </div>
    </aside>
  );
};
