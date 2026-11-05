import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { getAvatarInitials } from '../utils/avatarInitials';
import { getSectorAvatarProps } from '../../../lib/sectores';
import { PlantaModeSwitch } from './PlantaModeSwitch';

/**
 * Header shared by Gestión de Pasadas and Mi historial: línea name on the left, the
 * Pasadas / Mi historial switch in the center and, on the right, the user's avatar (only to
 * tell who is logged in, not interactive) next to the logout button.
 * Below `md` the switch drops to its own row so nothing gets squeezed.
 */
export function TabletPlantaHeader({ lineaNombre, onLogout }: { lineaNombre: string; onLogout: () => void }) {
  const { user } = useAuth();
  const sectorAvatar = getSectorAvatarProps(user?.sector);

  return (
    <header className="bg-card border-b border-border p-4 md:px-8 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-3">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{lineaNombre}</h1>
      <div className="col-span-2 row-start-2 justify-self-center md:col-span-1 md:col-start-2 md:row-start-1">
        <PlantaModeSwitch />
      </div>
      <div className="flex items-center gap-3 justify-self-end md:col-start-3 md:row-start-1">
        <div
          role="img"
          aria-label={`Usuario ${user?.nombreUsuario ?? ''}`.trim()}
          title={sectorAvatar.title}
          style={sectorAvatar.style}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm select-none ${sectorAvatar.className}`}
        >
          {getAvatarInitials(user?.nombreUsuario)}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium bg-muted/50 hover:bg-muted px-4 py-2 rounded-lg"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
