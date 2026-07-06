import { z } from 'zod';

export const etapaSchema = z.object({
  id: z.number().optional(),
  etapa: z.coerce.number().min(1, 'Requerido'),
  pesoMinimo: z.coerce.number().gt(0, 'Debe ser mayor a 0'),
  pesoMaximo: z.coerce.number().gt(0, 'Debe ser mayor a 0'),
  pesoIdeal: z.coerce.number().gt(0, 'Debe ser mayor a 0'),
  cantidadMuestrasRequeridas: z.coerce.number().min(1, 'Mínimo 1'),
}).superRefine((data, ctx) => {
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
