import { z } from 'zod';
import { MAGNITUDES, MAX_ATRIBUTOS_POR_ETAPA, TIPOS_ATRIBUTO } from '../../../shared/constants';

// Same bounds as the global tolerance (MuestrasConfigPage)
export const MIN_TOLERANCIA_PCT = 0;
export const MAX_TOLERANCIA_PCT = 50;

// A cualidad (manual quality) is defined inside the etapa: no catalog, no unit. 'aceptado' has a fixed 1..1 range
// that the backend applies, so the form neither asks for nor sends it.
export const atributoSchema = z
  .object({
    id: z.number().optional(),
    nombre: z.string().trim().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
    tipo: z.enum(TIPOS_ATRIBUTO),
    minimo: z.number().nullable().optional(),
    maximo: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo !== 'numerico') return;
    const falta = (v: number | null | undefined) => v == null || Number.isNaN(v);
    if (falta(data.minimo)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido', path: ['minimo'] });
    if (falta(data.maximo)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido', path: ['maximo'] });
    if (!falta(data.minimo) && !falta(data.maximo) && (data.maximo as number) < (data.minimo as number)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debe ser mayor o igual al mínimo', path: ['maximo'] });
    }
  });

export const etapaSchema = z.object({
  id: z.number().optional(),
  etapa: z.coerce.number().min(1, 'Requerido'),
  pesoMinimo: z.coerce.number({ error: 'Requerido' }).gt(0, 'Debe ser mayor a 0'),
  pesoMaximo: z.coerce.number({ error: 'Requerido' }).gt(0, 'Debe ser mayor a 0'),
  pesoIdeal: z.coerce.number({ error: 'Requerido' }).gt(0, 'Debe ser mayor a 0'),
  cantidadMuestrasRequeridas: z.coerce.number({ error: 'Requerido' }).min(1, 'Mínimo 1'),
  // undefined is treated as "por defecto" (uses the global tolerance)
  toleranciaPorDefecto: z.boolean().optional(),
  toleranciaPct: z.number().nullable().optional(),
  // undefined is treated as 'peso'
  magnitud: z.enum(MAGNITUDES).optional(),
  atributos: z.array(atributoSchema).max(MAX_ATRIBUTOS_POR_ETAPA, `Máximo ${MAX_ATRIBUTOS_POR_ETAPA} cualidades por etapa`).optional(),
}).superRefine((data, ctx) => {
  const vistos = new Set<string>();
  (data.atributos ?? []).forEach((a, i) => {
    const clave = a.nombre.trim().toLowerCase();
    if (clave && vistos.has(clave)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ya existe una cualidad con ese nombre', path: ['atributos', i, 'nombre'] });
    }
    vistos.add(clave);
  });
  if (data.toleranciaPorDefecto === false) {
    const pct = data.toleranciaPct;
    if (pct == null || Number.isNaN(pct)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requerido', path: ['toleranciaPct'] });
    } else if (pct < MIN_TOLERANCIA_PCT || pct > MAX_TOLERANCIA_PCT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Debe estar entre ${MIN_TOLERANCIA_PCT} y ${MAX_TOLERANCIA_PCT}`,
        path: ['toleranciaPct'],
      });
    } else if (Math.round(pct * 100) / 100 !== pct) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Máximo 2 decimales', path: ['toleranciaPct'] });
    }
  }
  if (data.pesoIdeal <= data.pesoMinimo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debe ser mayor al mínimo',
      path: ['pesoIdeal']
    });
  }
  if (data.pesoMaximo <= data.pesoIdeal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debe ser mayor al ideal',
      path: ['pesoMaximo']
    });
  }
});

export const rutaSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().optional(),
  etapas: z.array(etapaSchema),
});
