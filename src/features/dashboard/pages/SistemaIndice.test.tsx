import { describe, it, expect, vi, beforeAll } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { SistemaPage } from './SistemaPage';

describe('SistemaPage section index', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('highlights the clicked section immediately, even when the page cannot scroll it to the top', () => {
    renderWithProviders(<SistemaPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Administrador' }));

    expect(screen.getByRole('button', { name: 'Administrador' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Operario' })).not.toHaveAttribute('aria-current');
  });
});
