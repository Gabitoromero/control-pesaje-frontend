import type { ToleranceState } from '../../../hooks/useToleranceConfig';

/**
 * Status line shown under the "Registrar" button while the global weight
 * tolerance is loading or could not be obtained. Renders nothing once a value
 * is available.
 */
export function ToleranceStatus({ tolerance }: { tolerance: ToleranceState }) {
  if (tolerance.status === 'loading') {
    return <p className="text-sm text-muted-foreground">Cargando tolerancia de peso...</p>;
  }
  if (tolerance.status === 'unavailable') {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>No se pudo obtener la tolerancia de peso.</span>
        <button
          type="button"
          onClick={tolerance.retry}
          disabled={tolerance.isRetrying}
          className="underline font-semibold text-foreground disabled:opacity-60"
        >
          {tolerance.isRetrying ? 'Reintentando...' : 'Reintentar'}
        </button>
      </div>
    );
  }
  return null;
}
