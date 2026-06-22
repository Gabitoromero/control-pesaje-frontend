import { describe, it, expect } from 'vitest';
import { rutaSchema, etapaSchema } from './RutaFormPage';

describe('RutaFormPage Validation Schemas', () => {
  describe('rutaSchema', () => {
    it('should validate a valid ruta payload', () => {
      const validPayload = {
        nombre: 'Ruta 1',
        etapas: [
          {
            articulo: 1,
            etapa: 1,
            pesoMinimo: 10,
            pesoMaximo: 20,
            pesoIdeal: 15,
            cantidadMuestrasRequeridas: 1,
          }
        ]
      };
      
      const result = rutaSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should require a nombre', () => {
      const invalidPayload = {
        nombre: '',
        etapas: []
      };
      const result = rutaSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nombre es requerido');
      }
    });

    it('should require at least one etapa', () => {
      const invalidPayload = {
        nombre: 'Ruta 1',
        etapas: []
      };
      const result = rutaSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Debe agregar al menos una etapa');
      }
    });
  });

  describe('etapaSchema', () => {
    it('should require missing stage fields (pesoMinimo)', () => {
      const invalidEtapa = {
        articulo: 1,
        etapa: 1,
        pesoMinimo: -1, // invalid since min is 0
        pesoMaximo: 20,
        pesoIdeal: 15,
        cantidadMuestrasRequeridas: 1,
      };
      const result = etapaSchema.safeParse(invalidEtapa);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mínimo 0');
      }
    });

    it('should fail if required fields are missing/NaN', () => {
      const invalidEtapa = {
        articulo: 1,
        etapa: 1,
        // missing weights
      };
      const result = etapaSchema.safeParse(invalidEtapa);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        const hasMinimoError = result.error.issues.some(i => i.path.includes('pesoMinimo'));
        const hasMaximoError = result.error.issues.some(i => i.path.includes('pesoMaximo'));
        expect(hasMinimoError).toBe(true);
        expect(hasMaximoError).toBe(true);
      }
    });
  });
});
