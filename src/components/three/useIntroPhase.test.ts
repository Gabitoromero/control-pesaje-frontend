import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { BLUEPRINT_MS, useIntroPhase } from './useIntroPhase';

describe('useIntroPhase', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (sceneReady: boolean, reducedMotion = false) =>
    renderHook((props) => useIntroPhase(props), {
      initialProps: { sceneReady, reducedMotion },
    });

  it('starts on the blueprint', () => {
    const { result } = setup(false);
    expect(result.current).toBe('blueprint');
  });

  it('does not reveal before the drawing has finished, even if the scene is ready', () => {
    const { result } = setup(true);
    act(() => vi.advanceTimersByTime(BLUEPRINT_MS - 1));
    expect(result.current).toBe('blueprint');
  });

  it('reveals once the drawing has finished and the scene is ready', () => {
    const { result } = setup(true);
    act(() => vi.advanceTimersByTime(BLUEPRINT_MS));
    expect(result.current).toBe('reveal');
  });

  it('keeps waiting for a slow scene, then reveals as soon as it is ready', () => {
    const { result, rerender } = setup(false);
    act(() => vi.advanceTimersByTime(BLUEPRINT_MS * 3));
    expect(result.current).toBe('blueprint');

    rerender({ sceneReady: true, reducedMotion: false });
    expect(result.current).toBe('reveal');
  });

  it('skips the choreography under reduced motion', () => {
    const { result } = setup(true, true);
    expect(result.current).toBe('reveal');
  });
});
