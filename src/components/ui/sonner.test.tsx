import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { Toaster } from './sonner';

describe('Toaster (shadcn/Sonner source)', () => {
  it('renders a live region and announces a triggered toast', async () => {
    render(<Toaster />);

    toast.success('Guardado con éxito');

    await waitFor(() => {
      expect(screen.getByText('Guardado con éxito')).toBeInTheDocument();
    });

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeInTheDocument();
  });
});
