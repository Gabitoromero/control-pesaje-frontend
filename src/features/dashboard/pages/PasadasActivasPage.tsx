import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPasadas, abortarPasada } from '../../../api/pasadas';
import type { Pasada } from '../../../shared/types/domain';
import { ConfirmWithReasonDialog } from '../../../components/dialogs/ConfirmWithReasonDialog';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';

export const PasadasActivasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { alertError } = useDialog();
  const [selectedPasada, setSelectedPasada] = useState<Pasada | null>(null);

  const { data: pasadas = [], isLoading: loading, error } = useQuery<Pasada[]>({
    queryKey: ['pasadas-activas'],
    queryFn: () => getPasadas({ estado: 'en_curso' }),
    refetchInterval: 3000,
  });

  const abortMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => abortarPasada(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pasadas-activas'] });
      setSelectedPasada(null);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo abortar la pasada',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const handleConfirmAbort = async (motivo: string) => {
    if (!selectedPasada) return;
    try {
      await abortMutation.mutateAsync({ id: selectedPasada.id, motivo });
    } catch {
      // Error already surfaced via abortMutation.onError -> alertError.
    }
  };

  if (loading) {
    return <div className="p-6 text-foreground">Cargando pasadas...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">Error al cargar las pasadas activas</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Pasadas Activas</h2>
      {pasadas.length === 0 ? (
        <p className="text-muted-foreground">No hay pasadas en curso en la planta.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Línea de Producción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Operario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Artículo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hora de Inicio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {pasadas.map((pasada) => (
                  <tr key={pasada.id} className="hover:bg-accent even:bg-muted/40">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {pasada.lineaProduccion?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {pasada.usuario?.nombreApellido ?? pasada.usuario?.nombreUsuario ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {pasada.articulo?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {pasada.horaInicio ? new Date(pasada.horaInicio).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        En curso
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedPasada(pasada)}
                        disabled={abortMutation.isPending}
                        className="text-destructive hover:text-destructive/80 focus:outline-none disabled:opacity-50 px-3 py-1.5 rounded-md border border-destructive/30 text-xs font-medium"
                      >
                        Abortar Pasada
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmWithReasonDialog
        isOpen={selectedPasada !== null}
        title="Abortar Pasada"
        description="Esta acción no se puede deshacer. Ingresá el motivo del aborto."
        field={{
          kind: 'reason',
          label: 'Motivo',
          placeholder: 'Ej: rotura de bolsa, error de carga...',
        }}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmAbort}
        onClose={() => setSelectedPasada(null)}
      />
    </div>
  );
};
