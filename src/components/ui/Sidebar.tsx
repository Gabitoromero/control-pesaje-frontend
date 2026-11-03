import React, { useId, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  LayoutDashboard, FileBarChart, LogOut, Package, Users, UserRoundCog, Factory,
  Layers, Route as RouteIcon, SplinePointer, ChevronRight, Cog, Activity, Cpu, Sun, Moon, Radar, Scale, BookOpen, FlaskConical,
  PanelLeftClose,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '../../features/theme/ThemeContext';
import { UsuarioRol } from '../../shared/types';
import { Avatar } from './Avatar';

export interface SidebarProps {
  onNavClick?: () => void;
  /** When provided, a hide-menu button is shown in the header. */
  onToggleCollapse?: () => void;
}

const CATALOGO_PATHS = ['/usuarios', '/articulos', '/balanzas', '/etapas', '/lineas', '/rutas', '/dispositivos-conectados', '/dashboard/muestras'];
const ADMINISTRACION_PATHS = ['/sesiones-activas', '/pasadas-activas'];

const matchesAny = (pathname: string, paths: string[]) => paths.some(path => pathname.includes(path));

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  onNavigate: () => void;
}

/** Link whose active background glides between items (shared layout). */
function NavItem({ to, icon: Icon, label, end, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative flex items-center px-3 py-2.5 rounded-md transition-colors ${
          isActive
            ? 'text-brand font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              aria-hidden="true"
              className="absolute inset-0 rounded-md bg-brand-muted"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <Icon className="relative w-5 h-5 mr-3" />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  );
}

interface NavGroupProps {
  icon: LucideIcon;
  label: string;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Expandable group: rotating chevron and a height-animated child list. */
function NavGroup({ icon: Icon, label, open, active, onToggle, children }: NavGroupProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors hover:bg-accent hover:text-foreground ${
          active ? 'text-foreground font-medium' : 'text-muted-foreground'
        }`}
      >
        <span className="flex items-center">
          <Icon className="w-5 h-5 mr-3" />
          {label}
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-5 pl-3 border-l border-border space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavClick, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  // Each Sidebar instance (desktop + mobile drawer) owns its active-pill group.
  const layoutGroupId = useId();

  const [isCatalogoOpen, setIsCatalogoOpen] = useState(() =>
    matchesAny(location.pathname, CATALOGO_PATHS),
  );
  const [isAdministracionOpen, setIsAdministracionOpen] = useState(() =>
    matchesAny(location.pathname, ADMINISTRACION_PATHS),
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rol = user?.rol;
  const isAdmin = rol === UsuarioRol.ADMINISTRADOR;
  const isJefe = rol === UsuarioRol.JEFE || isAdmin;
  const isVisualizacion = rol === UsuarioRol.VISUALIZACION;

  const handleNavigate = () => {
    if (onNavClick) {
      onNavClick();
    }
  };

  return (
    <LayoutGroup id={layoutGroupId}>
      <aside className="w-64 bg-card flex flex-col shadow-sm flex-shrink-0 h-full">
        {/* Avatar + logout block (ux-polish Task 2: moved from bottom to top so
            the user is always visible without scrolling the nav). */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={user?.nombreUsuario} sector={user?.sector} data-testid="sidebar-avatar" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{user?.nombreUsuario}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.rol}</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  aria-label="Ocultar menú"
                  title="Ocultar menú"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          <NavItem to="/dashboard" end icon={LayoutDashboard} label="Monitoreo" onNavigate={handleNavigate} />

          {isJefe && (
            <NavItem to="/dashboard/planta" icon={Factory} label="Planta" onNavigate={handleNavigate} />
          )}

          {isJefe && (
            <NavGroup
              icon={Cog}
              label="Parametrización"
              open={isCatalogoOpen}
              active={matchesAny(location.pathname, CATALOGO_PATHS)}
              onToggle={() => setIsCatalogoOpen(open => !open)}
            >
              {isAdmin && (
                <NavItem to="/dashboard/usuarios" icon={UserRoundCog} label="Usuarios" onNavigate={handleNavigate} />
              )}
              <NavItem to="/dashboard/articulos" icon={Package} label="Artículos" onNavigate={handleNavigate} />
              <NavItem to="/dashboard/etapas" icon={Layers} label="Etapas" onNavigate={handleNavigate} />
              <NavItem to="/dashboard/balanzas" icon={Scale} label="Balanzas" onNavigate={handleNavigate} />
              <NavItem to="/dashboard/lineas" icon={SplinePointer} label="Líneas" onNavigate={handleNavigate} />
              <NavItem to="/dashboard/rutas" icon={RouteIcon} label="Rutas" onNavigate={handleNavigate} />
              <NavItem to="/dashboard/dispositivos-conectados" icon={Cpu} label="Dispositivos" onNavigate={handleNavigate} />
              {isAdmin && (
                <NavItem to="/dashboard/muestras" icon={FlaskConical} label="Muestras" onNavigate={handleNavigate} />
              )}
            </NavGroup>
          )}

          {isJefe && (
            <NavGroup
              icon={Radar}
              label="Administración"
              open={isAdministracionOpen}
              active={matchesAny(location.pathname, ADMINISTRACION_PATHS)}
              onToggle={() => setIsAdministracionOpen(open => !open)}
            >
              <NavItem to="/dashboard/pasadas-activas" icon={Activity} label="Pasadas Activas" onNavigate={handleNavigate} />
              {isAdmin && (
                <NavItem to="/dashboard/sesiones-activas" icon={Users} label="Sesiones Activas" onNavigate={handleNavigate} />
              )}
            </NavGroup>
          )}

          {!isVisualizacion && (
            <NavItem to="/dashboard/reportes" icon={FileBarChart} label="Reportes" onNavigate={handleNavigate} />
          )}

          <NavItem to="/dashboard/sistema" icon={BookOpen} label="Sistema" onNavigate={handleNavigate} />

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
    </LayoutGroup>
  );
};
