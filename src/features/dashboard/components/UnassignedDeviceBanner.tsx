import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLineas, assignDeviceToLinea } from '../../../api/lineas';
import { ConfirmWithReasonDialog } from '../../../components/dialogs/ConfirmWithReasonDialog';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import { useAdminSocket } from '../hooks/useAdminSocket';

function truncateHardwareId(hardwareId: string): string {
  return hardwareId.length > 8 ? `${hardwareId.slice(0, 8)}…` : hardwareId;
}

export function UnassignedDeviceBanner() {
  const { unassignedDevices, resolveDevice } = useAdminSocket();
  const { alertError } = useDialog();
  const queryClient = useQueryClient();
  const [selectedHardwareId, setSelectedHardwareId] = useState<string | null>(null);

  const { data: lineas = [] } = useQuery({
    queryKey: ['lineas'],
    queryFn: getLineas,
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, hardwareId }: { id: number; hardwareId: string }) =>
      assignDeviceToLinea(id, hardwareId),
    onSuccess: (_data, variables) => {
      resolveDevice(variables.hardwareId);
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      setSelectedHardwareId(null);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo asignar el dispositivo',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const handleConfirm = async (value: string) => {
    if (!selectedHardwareId) return;
    try {
      await assignMutation.mutateAsync({ id: Number(value), hardwareId: selectedHardwareId });
    } catch {
      // Error already surfaced via assignMutation.onError -> alertError.
    }
  };

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
            onClick={() => setSelectedHardwareId(hardwareId)}
            className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Asignar
          </button>
        </div>
      ))}

      <ConfirmWithReasonDialog
        isOpen={selectedHardwareId !== null}
        title="Asignar dispositivo a línea"
        description="Elegí la línea de producción a la que pertenece este dispositivo."
        field={{
          kind: 'select',
          label: 'Línea',
          placeholder: 'Seleccioná una línea',
          options: lineas.map((linea) => ({ value: String(linea.id), label: linea.nombre })),
        }}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onClose={() => setSelectedHardwareId(null)}
      />
    </div>
  );
}
