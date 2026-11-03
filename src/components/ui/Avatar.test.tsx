import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

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
});
