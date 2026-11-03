import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { focusFirstFormError } from './focusFirstFormError';

describe('focusFirstFormError', () => {
  const scrollIntoView = vi.fn();
  const animate = vi.fn();

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    HTMLElement.prototype.animate = animate;
    document.body.innerHTML = `
      <input data-field="nombre" />
      <div data-field="etapas.0.pesoMinimo"><input /></div>
      <div data-field="etapas.0.pesoMaximo"><input /></div>
      <div data-field="etapas.1.pesoMaximo"><input /></div>`;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('targets the first errored field in page order, not in error-object order', () => {
    const target = focusFirstFormError({
      etapas: [{ pesoMaximo: { type: 'custom', message: 'x' } }, { pesoMaximo: { type: 'custom' } }],
    });

    expect(target?.dataset.field).toBe('etapas.0.pesoMaximo');
  });

  it('scrolls the field into the middle of the viewport and pulses it three times', () => {
    focusFirstFormError({ etapas: [{ pesoMinimo: { type: 'too_small', message: 'Debe ser mayor a 0' } }] });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][1]).toMatchObject({ iterations: 3 });
  });

  it('focuses the input inside the target without scrolling again', () => {
    focusFirstFormError({ etapas: [{ pesoMinimo: { type: 'custom' } }] });

    expect(document.activeElement).toBe(document.querySelector('[data-field="etapas.0.pesoMinimo"] input'));
  });

  it('supports a field that is itself the input (nombre)', () => {
    const target = focusFirstFormError({ nombre: { type: 'too_small', message: 'Nombre es requerido' } });

    expect(target).toBe(document.querySelector('[data-field="nombre"]'));
    expect(document.activeElement).toBe(target);
  });

  it('does nothing when no tagged field has an error', () => {
    expect(focusFirstFormError({ etapas: { type: 'custom', message: 'sin etapas' } })).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  it('does not throw where scrollIntoView and animate are unavailable', () => {
    // @ts-expect-error simulating an environment without the Web Animations API
    delete HTMLElement.prototype.animate;
    // @ts-expect-error simulating an environment without scrollIntoView
    delete HTMLElement.prototype.scrollIntoView;

    expect(() => focusFirstFormError({ nombre: { type: 'custom' } })).not.toThrow();
  });
});
