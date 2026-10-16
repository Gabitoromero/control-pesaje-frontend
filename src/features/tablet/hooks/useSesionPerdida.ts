import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useDialog } from '../../../components/dialogs/useDialog';

/**
 * Handler for a line session that no longer exists in the backend (heartbeat
 * answered 404). Tells the operator, clears the active line locally and sends
 * them to the line selection, where a new session is created.
 */
export const useSesionPerdida = () => {
  const { closeLineSession } = useAuth();
  const { alertWarning } = useDialog();
  const navigate = useNavigate();

  return async () => {
    await alertWarning({
      title: 'Sesión cerrada',
      description: 'Se perdió la sesión de la línea. Seleccioná la línea nuevamente para continuar.',
    });
    await closeLineSession();
    navigate('/tablet/seleccion-linea', { replace: true });
  };
};
