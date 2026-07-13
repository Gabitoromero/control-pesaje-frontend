import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dispositivosApi } from '../../../api/dispositivos';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import { useAdminSocket } from '../hooks/useAdminSocket';

const DEVICE_ALREADY_EXISTS_MESSAGE = 'El dispositivo ya existe';

function truncateHardwareId(hardwareId: string): string {
  return hardwareId.length > 8 ? `${hardwareId.slice(0, 8)}…` : hardwareId;
}

export function UnassignedDeviceBanner() {
  const { unassignedDevices, resolveDevice } = useAdminSocket();
  const { alertError } = useDialog();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: (hardwareId: string) => dispositivosApi.createDispositivo(hardwareId),
    onSuccess: (_data, hardwareId) => {
      resolveDevice(hardwareId);
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
    },
    onError: (err: unknown, hardwareId) => {
      const message = getApiErrorMessage(err, 'Ocurrió un error inesperado');
      // The device is already registered — a race with another registration
      // path. The device is present in the system either way, so treat it
      // as success-equivalent: resolve the banner and refresh the list.
      if (message === DEVICE_ALREADY_EXISTS_MESSAGE) {
        resolveDevice(hardwareId);
        queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
        return;
      }
      alertError({
        title: 'No se pudo registrar el dispositivo',
        description: message,
      });
    },
  });

  if (unassignedDevices.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm">
      {unassignedDevices.map((hardwareId) => (
        <div
          key={hardwareId}
          className="bg-card border border-border rounded-2xl shadow-2xl p-4"
        >
          <p className="text-sm font-medium text-foreground">Dispositivo desconocido</p>
          <p className="font-mono text-xs truncate text-muted-foreground mb-3">
            {truncateHardwareId(hardwareId)}
          </p>
          <button
            type="button"
            onClick={() => registerMutation.mutate(hardwareId)}
            className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Registrar dispositivo
          </button>
        </div>
      ))}
    </div>
  );
}
