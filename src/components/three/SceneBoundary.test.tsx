import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SceneBoundary from './SceneBoundary';

function Boom(): never {
  throw new Error('WebGL unavailable');
}

describe('SceneBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <SceneBoundary fallback={<p>fallback</p>}>
        <p>scene</p>
      </SceneBoundary>,
    );
    expect(screen.getByText('scene')).toBeInTheDocument();
    expect(screen.queryByText('fallback')).not.toBeInTheDocument();
  });

  it('renders the fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SceneBoundary fallback={<p>fallback</p>}>
        <Boom />
      </SceneBoundary>,
    );
    expect(screen.getByText('fallback')).toBeInTheDocument();
    spy.mockRestore();
  });
});
