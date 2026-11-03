import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';
import { getSectorColor } from '../../lib/sectores';

describe('Avatar', () => {
  it('shows the user initials', () => {
    render(<Avatar name="Ana Pérez" />);
    expect(screen.getByText('AP')).toBeInTheDocument();
  });

  it('falls back to ? when there is no name', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('is decorative: hidden from assistive tech', () => {
    const { container } = render(<Avatar name="admin" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('is filled with the sector color and shows the sector label as a tooltip', () => {
    const { container } = render(<Avatar name="Ana Pérez" sector="SU" />);
    const avatar = container.firstElementChild as HTMLElement;
    expect(avatar).toHaveStyle({ backgroundColor: getSectorColor('SU') });
    expect(avatar).toHaveAttribute('title', 'Supervisores');
    expect(avatar.className).not.toContain('from-brand');
  });

  it('keeps the brand gradient and no inline color when the user has no sector', () => {
    const { container } = render(<Avatar name="Ana Pérez" />);
    const avatar = container.firstElementChild as HTMLElement;
    expect(avatar.style.backgroundColor).toBe('');
    expect(avatar).not.toHaveAttribute('title');
    expect(avatar.className).toContain('from-brand');
  });

  it('forwards a test id', () => {
    render(<Avatar name="Ana Pérez" data-testid="mi-avatar" />);
    expect(screen.getByTestId('mi-avatar')).toBeInTheDocument();
  });
});
