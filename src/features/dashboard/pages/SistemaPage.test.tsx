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

  it('tells operators the global tolerance is the default, edited only by an Administrator, and that an etapa can have its own', () => {
    const text = renderText();

    expect(text).toMatch(/porcentaje global es el valor por defecto/);
    expect(text).toMatch(/lo edita solamente un Administrador/);
    expect(text).toMatch(/hasta 30 segundos/);
    expect(text).toMatch(/su propia tolerancia/);
    expect(text).not.toMatch(/único valor para todas las líneas, etapas y artículos/);
  });

  it('documents the per-etapa tolerance in the Rutas manual and states that the global one is only the default', () => {
    const text = renderText();

    expect(text).toMatch(/Tolerancia por defecto/);
    expect(text).toMatch(/Tolerancia propia \(%\)/);
    expect(text).toMatch(/salvo a las etapas de una ruta que tengan su propia tolerancia/);
    expect(text).not.toMatch(/no uno por etapa/);
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

describe('SistemaPage operator history copy', () => {
  it('documents "Mi historial": the switch, own muestras only, KPIs, filters, colors and the observación toggle', () => {
    const text = renderText();

    expect(text).toMatch(/8\. Mi historial/);
    expect(text).toMatch(/interruptor "Pasadas \/ Mi historial"/);
    expect(text).toMatch(/únicamente las muestras que tomaste vos/);
    expect(text).toMatch(/Muestras OK/);
    expect(text).toMatch(/de 20 en 20/);
    expect(text).toMatch(/fondo verde/);
    expect(text).toMatch(/fondo rojo/);
    expect(text).toMatch(/Tiene observación|ícono de mensaje/);
  });
});

describe('SistemaPage reports copy', () => {
  it('documents the three reports, the 90-day range and the loading screen instead of the old single report', () => {
    const text = renderText();

    expect(text).toMatch(/Reporte de Muestras/);
    expect(text).toMatch(/Reporte de Pasadas/);
    expect(text).toMatch(/Reporte de Rutas de Pasada/);
    expect(text).toMatch(/90 días/);
    expect(text).toMatch(/Generando el reporte en el servidor/);
    expect(text).not.toMatch(/Reporte de Pasadas y Muestras/);
    expect(text).not.toMatch(/Disponible próximamente/);
    expect(text).not.toMatch(/rango máximo permitido es de 5 días/);
  });
});

describe('SistemaPage sector copy', () => {
  it('documents the Sector field in Usuarios, the dot colors with the red ring in Monitoreo and the avatar color', () => {
    const text = renderText();

    expect(text).toMatch(/Oficiales, Supervisores, Control de Calidad o Mejora Continua/);
    expect(text).toMatch(/no cambia roles ni permisos/);
    expect(text).toMatch(/color del avatar \(en el menú lateral y en las pantallas de la tablet\)/);
    expect(text).toMatch(/color del sector de quien tomó la muestra/);
    expect(text).toMatch(/Oficiales naranja, Supervisores verde oscuro, Control de Calidad bordó y Mejora Continua morado/);
    expect(text).toMatch(/anillo rojo/);
    expect(text).toMatch(/sin sector/i);
    expect(text).toMatch(/Para quitarlo, elegí "Sin sector"/);
    expect(text).toMatch(/leyenda al pie de cada gráfico/);
    expect(text).toMatch(/columna Sector de la tabla/);
    expect(text).toMatch(/filtrar la lista por sector/);
  });
});
