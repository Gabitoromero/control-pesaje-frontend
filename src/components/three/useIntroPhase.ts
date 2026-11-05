import { useEffect, useState } from 'react';

/** How long the blueprint choreography (draw + fill) lasts before the 3D reveal. */
export const BLUEPRINT_MS = 3400;

export type IntroPhase = 'blueprint' | 'reveal';

interface Options {
  /** The 3D scene has been created and can be shown. */
  sceneReady: boolean;
  reducedMotion: boolean;
}

/**
 * Sequence of the login hero: blueprint drawing, then the 3D scene. The
 * reveal waits for BOTH the drawing to finish and the scene to be ready, so
 * a slow download never shows an empty frame. Reduced motion skips the show.
 */
export function useIntroPhase({ sceneReady, reducedMotion }: Options): IntroPhase {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setDrawn(true), BLUEPRINT_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return sceneReady && (drawn || reducedMotion) ? 'reveal' : 'blueprint';
}
