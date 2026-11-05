import { lazy, Suspense, useCallback, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import BalanzaBlueprint from './BalanzaBlueprint';
import BalanzaFallback from './BalanzaFallback';
import SceneBoundary from './SceneBoundary';
import { useIntroPhase } from './useIntroPhase';

const BalanzaScene = lazy(() => import('./BalanzaScene'));

/**
 * Login hero: starts empty, draws the scale as a blueprint, fills it with
 * color, then reveals the 3D scene and drops the letter. If WebGL fails the
 * 2D branding animation takes over.
 */
export default function BalanzaHero({ dark }: { dark: boolean }) {
  const reducedMotion = !!useReducedMotion();
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);
  const phase = useIntroPhase({ sceneReady, reducedMotion });
  const revealed = phase === 'reveal';

  return (
    <SceneBoundary fallback={<BalanzaFallback />}>
      <div className="relative w-full h-72 lg:h-80">
        <BalanzaBlueprint animate={!reducedMotion} revealed={revealed} dark={dark} />
        <Suspense fallback={null}>
          <BalanzaScene dark={dark} visible={revealed} playing={revealed} onReady={handleReady} />
        </Suspense>
      </div>
    </SceneBoundary>
  );
}
