import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { SistemaPage } from './SistemaPage';

const renderText = () => renderWithProviders(<SistemaPage />).container.textContent ?? '';

describe('SistemaPage tolerance copy', () => {
  it('describes the tolerance as configurable instead of a fixed 20%', () => {
    const text = renderText();

    expect(text).toMatch(/porcentaje de tolerancia global, configurado por un Administrador/);
    expect(text).toMatch(/Parametrización → Muestras/);
    expect(text).not.toMatch(/20\s*%\s*del rango/);
  });

  it('tells operators the tolerance is a single global value that only an Administrator edits', () => {
    const text = renderText();

    expect(text).toMatch(/único valor para todas las líneas, etapas y artículos/);
    expect(text).toMatch(/lo edita solamente un Administrador/);
    expect(text).toMatch(/hasta 30 segundos/);
  });

  it('explains to operators what happens when the tolerance cannot be read', () => {
    const text = renderText();

    expect(text).toMatch(/Tolerancia no disponible/);
    expect(text).toMatch(/Reintentar/);
    expect(text).toMatch(/último valor conocido/);
  });

  it('documents the tolerance screen in the Administrator manual', () => {
    const text = renderText();

    expect(text).toMatch(/4\. Parametrización — Muestras \(tolerancia de peso\)/);
    expect(text).toMatch(/Pantalla exclusiva de Administrador, dentro del grupo "Parametrización"/);
    expect(text).toMatch(/entre 0% y 50%/);
    expect(text).toMatch(/global/);
    expect(text).toMatch(/Valor inicial del sistema/);
    expect(text).toMatch(/solo se guarda el último cambio/);
  });

  it('states the exact blocking rule with a worked example', () => {
    const text = renderText();

    expect(text).toMatch(/por debajo del \(100 − %\) del peso mínimo/);
    expect(text).toMatch(/por encima del \(100 \+ %\) del peso máximo/);
    expect(text).toMatch(/menos de 8 kg o más de 24 kg/);
  });

  it('lists three exclusive Administrator sections in the intro', () => {
    const text = renderText();

    expect(text).toMatch(/más tres secciones exclusivas/);
    expect(text).not.toMatch(/más dos secciones exclusivas/);
  });
});
