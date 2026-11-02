import { z } from 'zod';

// Same bounds as the global tolerance (MuestrasConfigPage)
export const MIN_TOLERANCIA_PCT = 0;
export const MAX_TOLERANCIA_PCT = 50;

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
}).superRefine((data, ctx) => {
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
