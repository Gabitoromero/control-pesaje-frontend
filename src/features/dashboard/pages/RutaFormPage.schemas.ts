import { z } from 'zod';

export const etapaSchema = z.object({
  id: z.number().optional(),
  etapa: z.coerce.number().min(1, 'Requerido'),
  pesoMinimo: z.coerce.number().min(0, 'Mínimo 0'),
  pesoMaximo: z.coerce.number().min(0, 'Mínimo 0'),
  pesoIdeal: z.coerce.number().min(0, 'Mínimo 0'),
  cantidadMuestrasRequeridas: z.coerce.number().min(1, 'Mínimo 1'),
});

export const rutaSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().optional(),
  etapas: z.array(etapaSchema),
});
