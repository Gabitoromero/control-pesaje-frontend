import { useEffect, useRef, useState, type RefObject } from 'react';
import { useMotionValue, useSpring } from 'motion/react';

/** A section counts as active once its top has crossed this line (px from the scroll edge). */
const UMBRAL_ACTIVA_PX = 160;
/** Fallback end-of-jump timeout for browsers without the `scrollend` event. */
const FIN_SALTO_FALLBACK_MS = 1200;
/** Tolerance (px) to consider the scroll position unchanged since a jump. */
const TOLERANCIA_PX = 2;

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** `<main>` in DashboardLayout is the real scroller (overflow-auto), not `window`. */
function contenedorScroll(desde: HTMLElement): HTMLElement | null {
  for (let el = desde.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === 'auto' || overflowY === 'scroll') return el;
  }
  return null;
}

/**
 * Tracks reading progress and the active section of a long page whose
 * scroller is an ancestor of `rootRef`. `ids` must be a stable constant.
 *
 * A jump from the index pins its target as active: short pages may not be
 * able to bring the target to the top line, so position alone would
 * highlight the wrong section. The pin is released once the user scrolls.
 */
export function useSistemaNavegacion(rootRef: RefObject<HTMLElement | null>, ids: readonly string[]) {
  const [activa, setActiva] = useState(ids[0]);
  const progreso = useMotionValue(0);
  const progresoSuave = useSpring(progreso, { stiffness: 220, damping: 34, restDelta: 0.001 });
  const iniciarSaltoRef = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scroller = contenedorScroll(root);
    const origen: HTMLElement | Window = scroller ?? window;

    const posicion = () => (scroller ? scroller.scrollTop : window.scrollY);
    const maximo = () =>
      scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;

    let enVuelo = false;
    let ancla: string | null = null;
    let posTras = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const actualizar = () => {
      const pos = posicion();
      const max = maximo();
      progreso.set(max > 0 ? Math.min(1, pos / max) : 0);

      if (enVuelo) return;
      if (ancla !== null && Math.abs(pos - posTras) <= TOLERANCIA_PX) {
        setActiva(ancla);
        return;
      }
      ancla = null;

      if (max > 0 && pos >= max - TOLERANCIA_PX) {
        setActiva(ids[ids.length - 1]);
        return;
      }
      const topeVisible = scroller ? scroller.getBoundingClientRect().top : 0;
      let actual = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - topeVisible <= UMBRAL_ACTIVA_PX) actual = id;
      }
      setActiva(actual);
    };

    const terminarSalto = () => {
      if (!enVuelo) return;
      enVuelo = false;
      clearTimeout(timer);
      posTras = posicion();
      actualizar();
    };

    iniciarSaltoRef.current = (id: string) => {
      ancla = id;
      enVuelo = true;
      setActiva(id);
      clearTimeout(timer);
      timer = setTimeout(terminarSalto, FIN_SALTO_FALLBACK_MS);
    };

    actualizar();
    origen.addEventListener('scroll', actualizar, { passive: true });
    origen.addEventListener('scrollend', terminarSalto);
    return () => {
      origen.removeEventListener('scroll', actualizar);
      origen.removeEventListener('scrollend', terminarSalto);
      clearTimeout(timer);
      iniciarSaltoRef.current = () => {};
    };
  }, [rootRef, ids, progreso]);

  const irA = (id: string) => {
    iniciarSaltoRef.current(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth', block: 'start' });
  };

  return { activa, progresoSuave, irA };
}
