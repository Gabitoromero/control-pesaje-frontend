import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AtributoEtapa } from '../../../shared/types/domain';
import { VALOR_ATRIBUTO_ACEPTADO, VALOR_ATRIBUTO_NO_ACEPTADO } from '../../../shared/constants';

export interface CualidadValorInput {
  atributoId: number;
  valor: number;
}

export interface CualidadesDialogProps {
  etapaNombre: string;
  atributos: AtributoEtapa[];
  /** Saves every value; a rejection keeps the dialog open with an error so the operator can retry. */
  onSubmit: (valores: CualidadValorInput[]) => Promise<void>;
  /** The values already stored could not be read: warns that loading again replaces what was stored. */
  sinVerificar?: boolean;
}

const OPCIONES_ACEPTADO = [
  { label: 'Aceptado', valor: VALOR_ATRIBUTO_ACEPTADO },
  { label: 'No aceptado', valor: VALOR_ATRIBUTO_NO_ACEPTADO },
] as const;

const parseNumero = (texto: string | undefined): number | null => {
  if (texto === undefined || texto.trim() === '') return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
};

/**
 * Blocking dialog shown on the tablet when the samples of an etapa are done and its manual cualidades are still
 * pending. It cannot be dismissed: the operator loads every value before moving on (the backend rejects the next
 * stage's samples otherwise). An out-of-range number does not block, it only warns (it shows in red in the report).
 */
export function CualidadesDialog({ etapaNombre, atributos, onSubmit, sinVerificar = false }: CualidadesDialogProps) {
  const titleId = useId();
  const [entradas, setEntradas] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorDe = (a: AtributoEtapa): number | null => {
    const texto = entradas[a.id];
    if (a.tipo === 'aceptado') return texto === undefined ? null : Number(texto);
    return parseNumero(texto);
  };
  const completo = atributos.every((a) => valorDe(a) !== null);

  const handleGuardar = async () => {
    if (!completo || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await onSubmit(atributos.map((a) => ({ atributoId: a.id, valor: valorDe(a) as number })));
    } catch {
      setError('No se pudieron guardar las cualidades. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <h2 id={titleId} className="text-2xl font-bold text-foreground">
          Cualidades de {etapaNombre}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Terminaste las muestras de la etapa. Cargá estos datos para poder seguir.
        </p>
        {sinVerificar && (
          <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
            No se pudo verificar lo ya cargado. Si estas cualidades ya estaban guardadas, los valores que cargues las reemplazan.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-5">
          {atributos.map((a) => {
            const numero = a.tipo === 'numerico' ? parseNumero(entradas[a.id]) : null;
            const fuera = numero !== null && (numero < a.minimo || numero > a.maximo);
            return (
              <div key={a.id} className="flex flex-col gap-2">
                <span className="text-base font-semibold text-foreground">{a.nombre}</span>
                {a.tipo === 'numerico' ? (
                  <>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      aria-label={a.nombre}
                      value={entradas[a.id] ?? ''}
                      onChange={(e) => setEntradas((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:[color-scheme:dark]"
                    />
                    <span className="text-xs text-muted-foreground">
                      Rango aceptado: {a.minimo} a {a.maximo}
                    </span>
                    {fuera && (
                      <span role="status" className="text-sm font-medium text-warning">
                        Fuera del rango aceptado
                      </span>
                    )}
                  </>
                ) : (
                  <div role="radiogroup" aria-label={a.nombre} className="grid grid-cols-2 gap-3">
                    {OPCIONES_ACEPTADO.map((op) => {
                      const elegido = entradas[a.id] === String(op.valor);
                      return (
                        <label
                          key={op.label}
                          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-xl font-bold transition-colors ${
                            elegido
                              ? op.valor === VALOR_ATRIBUTO_ACEPTADO
                                ? 'border-success bg-success/15 text-success'
                                : 'border-destructive bg-destructive/15 text-destructive'
                              : 'border-border bg-background text-foreground'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`cualidad-${a.id}`}
                            value={op.valor}
                            checked={elegido}
                            onChange={() => setEntradas((prev) => ({ ...prev, [a.id]: String(op.valor) }))}
                            className="sr-only"
                          />
                          {op.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={!completo || guardando}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {guardando && <Loader2 className="h-5 w-5 animate-spin" />}
          Guardar cualidades
        </button>
      </div>
    </div>
  );
}
