import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateToleranciaConfig } from '../../../api/tolerancia';
import type { ToleranciaConfig } from '../../../api/tolerancia';
import { TOLERANCE_QUERY_KEY, toleranceQueryOptions } from '../../../hooks/useToleranceConfig';
import { formatTolerancePct } from '../../tablet/utils/tolerance';
import { TolerancePreview } from '../components/TolerancePreview';

// UI-only limit (SC-001 product decision); the API accepts any value >= 0.
const MIN_TOLERANCE_PCT = 0;
const MAX_TOLERANCE_PCT = 50;

/** Returns the parsed value, or null when the text is empty, non-numeric or out of range. */
const parseTolerance = (text: string): number | null => {
  if (text.trim() === '') return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < MIN_TOLERANCE_PCT || value > MAX_TOLERANCE_PCT) return null;
  return value;
};

const formatLastChange = (iso: string): string => {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timePart = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart} ${timePart}`;
};

function LastChange({ config }: { config: ToleranciaConfig }) {
  if (config.updatedBy === null) {
    return <p className="text-sm text-muted-foreground">Valor inicial del sistema</p>;
  }
  return (
    <p className="text-sm text-muted-foreground">
      Último cambio: {config.updatedBy.nombreApellido} ({config.updatedBy.nombreUsuario}) -{' '}
      {formatLastChange(config.updatedAt)}
    </p>
  );
}

export function MuestrasConfigPage() {
  const queryClient = useQueryClient();
  const inputId = useId();
  // Admin page reports load failures immediately instead of the tablets' 3 retries.
  const { data, isPending, isError } = useQuery({ ...toleranceQueryOptions(), retry: false });
  // null = untouched; a refetch must never overwrite an in-progress edit.
  const [draft, setDraft] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: updateToleranciaConfig,
    onSuccess: (saved) => {
      queryClient.setQueryData(TOLERANCE_QUERY_KEY, saved);
      void queryClient.invalidateQueries({ queryKey: TOLERANCE_QUERY_KEY });
      setDraft(null);
      toast.success('Tolerancia actualizada');
    },
    onError: () => {
      toast.error('No se pudo guardar la tolerancia');
    },
  });

  if (data === undefined) {
    if (isPending) return <div className="p-6 text-foreground">Cargando tolerancia...</div>;
    if (isError) {
      return <div className="p-6 text-destructive">No se pudo cargar la tolerancia de peso</div>;
    }
  }
  if (data === undefined) return null;

  const text = draft ?? String(data.toleranciaPct);
  const parsed = parseTolerance(text);
  const isValid = parsed !== null;
  const isUnchanged = parsed === data.toleranciaPct;
  const canSave = isValid && !isUnchanged && !mutation.isPending;

  const handleSave = () => {
    if (parsed === null) return;
    mutation.mutate(parsed);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Muestras</h1>

      <section className="bg-card border border-border rounded-lg shadow p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Tolerancia actual</p>
          <p data-testid="current-tolerance" className="text-3xl font-bold text-foreground">
            {formatTolerancePct(data.toleranciaPct)}%
          </p>
          <LastChange config={data} />
        </div>

        <div className="space-y-2">
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            Tolerancia de peso (%)
          </label>
          <div className="flex items-center gap-3">
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={MIN_TOLERANCE_PCT}
              max={MAX_TOLERANCE_PCT}
              step={0.1}
              value={text}
              onChange={(e) => setDraft(e.target.value)}
              className="w-32 px-3 py-2 rounded-md border border-border bg-background text-foreground"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          {!isValid && (
            <p role="alert" className="text-sm text-destructive">
              Ingresá un valor entre {MIN_TOLERANCE_PCT} y {MAX_TOLERANCE_PCT}.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Porcentaje que se admite por fuera del peso mínimo y máximo de cada etapa antes de bloquear el registro de una muestra.
          </p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg shadow p-6 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Vista previa</h2>
        <TolerancePreview toleranciaPct={parsed ?? data.toleranciaPct} />
      </section>
    </div>
  );
}
