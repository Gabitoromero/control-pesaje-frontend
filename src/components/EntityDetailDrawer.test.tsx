import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityDetailDrawer } from './EntityDetailDrawer';

const LONG = 'Caramelo sabor frutilla en palito con una descripción muy larga que en la tabla queda cortada';

describe('EntityDetailDrawer', () => {
  it('shows every field in full, including long text and empty values', () => {
    render(
      <EntityDetailDrawer
        open
        onOpenChange={() => {}}
        title="Detalle del artículo"
        subtitle="ABC-1"
        fields={[
          { label: 'Código', value: 'ABC-1' },
          { label: 'Descripción', value: LONG },
          { label: 'Nombre', value: null },
        ]}
      />,
    );

    expect(screen.getByText('Detalle del artículo')).toBeInTheDocument();
    expect(screen.getAllByText('ABC-1').length).toBeGreaterThan(0);
    expect(screen.getByText(LONG)).toBeInTheDocument();
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(<EntityDetailDrawer open={false} onOpenChange={() => {}} title="Detalle" fields={[{ label: 'Código', value: 'X' }]} />);
    expect(screen.queryByText('Detalle')).not.toBeInTheDocument();
  });

  it('offers the history action only when provided and calls it', async () => {
    const onViewHistorial = vi.fn();
    const { rerender } = render(
      <EntityDetailDrawer open onOpenChange={() => {}} title="Detalle" fields={[]} />,
    );
    expect(screen.queryByRole('button', { name: /historial/i })).not.toBeInTheDocument();

    rerender(<EntityDetailDrawer open onOpenChange={() => {}} title="Detalle" fields={[]} onViewHistorial={onViewHistorial} />);
    await userEvent.click(screen.getByRole('button', { name: /historial/i }));
    expect(onViewHistorial).toHaveBeenCalledTimes(1);
  });
});
