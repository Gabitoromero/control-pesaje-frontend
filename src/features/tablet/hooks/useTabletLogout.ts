import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useDialog } from '../../../components/dialogs/useDialog';
import { resetSocket } from '../../../services/websocket';
import { CONFIRM_LOGOUT_MESSAGE } from '../constants/logoutGuard';

/**
 * "Cerrar sesión" for the tablet pages that show the shared header.
 * With an active line session it asks for confirmation through the in-app dialog before tearing
 * it down; without one there is nothing to lose and it proceeds directly.
 */
export function useTabletLogout() {
  const { user, closeLineSession, activeLineaId, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useDialog();

  return async () => {
    if (activeLineaId) {
      const ok = await confirm({
        title: 'Cerrar sesión',
        description: CONFIRM_LOGOUT_MESSAGE,
        confirmText: 'Cerrar sesión',
        cancelText: 'Cancelar',
        variant: 'destructive',
      });
      if (!ok) return;
    }
    if (user?.rol === 'jefe' || user?.rol === 'administrador') {
      // Don't closeLineSession here — the guard in the page would fire a
      // <Navigate> to /tablet/seleccion-linea as soon as activeLineaId
      // becomes null, overriding this navigate('/dashboard').
      // DashboardLayout already handles orphaned sessions on mount.
      navigate('/dashboard');
    } else {
      resetSocket();
      closeLineSession().finally(() => {
        logout();
      });
    }
  };
}
