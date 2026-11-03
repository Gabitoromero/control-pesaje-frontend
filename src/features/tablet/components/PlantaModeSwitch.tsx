import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { UsuarioRol } from '../../../shared/types';

export const HISTORIAL_PATH = '/tablet/historial';
export const PASADAS_PATH = '/tablet/pasadas';

const ROLES_CON_HISTORIAL: string[] = [UsuarioRol.OPERARIO, UsuarioRol.JEFE, UsuarioRol.ADMINISTRADOR];

/**
 * Switch between the pasadas list and the user's own history.
 * Only TabletPlantaHeader renders it, so it shows up in Gestión de Pasadas and Mi historial
 * and nowhere else (muestras libres and the workspace have their own headers without it).
 */
export function PlantaModeSwitch() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!user || !ROLES_CON_HISTORIAL.includes(user.rol)) return null;

  const enHistorial = pathname.startsWith(HISTORIAL_PATH);

  const option = (label: string, active: boolean, to: string) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        if (!active) navigate(to);
      }}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="Vista de Planta"
      className="flex items-center gap-1 bg-card border border-border rounded-full p-1 shadow-sm"
    >
      {option('Pasadas', !enHistorial, PASADAS_PATH)}
      {option('Mi historial', enHistorial, HISTORIAL_PATH)}
    </div>
  );
}
