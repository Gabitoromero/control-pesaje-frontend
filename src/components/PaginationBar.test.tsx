import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationBar } from './PaginationBar';

describe('PaginationBar', () => {
  it('shows the visible range and total', () => {
    render(<PaginationBar page={2} pageSize={20} total={45} onPageChange={vi.fn()} />);

    expect(screen.getByText('Mostrando 21–40 de 45')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('goes to the previous and next pages', () => {
    const onPageChange = vi.fn();
    render(<PaginationBar page={2} pageSize={20} total={45} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('disables the edges', () => {
    const { rerender } = render(<PaginationBar page={1} pageSize={20} total={45} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    rerender(<PaginationBar page={3} pageSize={20} total={45} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByText('Mostrando 41–45 de 45')).toBeInTheDocument();
  });

  it('shows no range for an empty result', () => {
    render(<PaginationBar page={1} pageSize={20} total={0} onPageChange={vi.fn()} />);

    expect(screen.getByText('Mostrando 0 de 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});
