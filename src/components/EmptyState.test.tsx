import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the icon, title, and subtitle', () => {
    render(<EmptyState icon={Inbox} title="Sin líneas activas" subtitle="Ninguna línea tiene una ruta asignada." />);

    expect(screen.getByText('Sin líneas activas')).toBeInTheDocument();
    expect(screen.getByText('Ninguna línea tiene una ruta asignada.')).toBeInTheDocument();
  });

  it('renders without a subtitle', () => {
    render(<EmptyState icon={Inbox} title="Sin datos" />);

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });
});
