import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SearchableCombobox } from './SearchableCombobox';
import { computePopoverPlacement } from './popoverPlacement';

const options = [
  { id: 1, nombre: 'Amasado' },
  { id: 2, nombre: 'Horneado' },
];

describe('computePopoverPlacement', () => {
  it('opens below with the default list height when there is plenty of room', () => {
    expect(computePopoverPlacement({ top: 100, bottom: 140 }, 900)).toEqual({ side: 'bottom', listMaxHeight: 300 });
  });

  it('flips above when the trigger is near the bottom and there is more room above', () => {
    const placement = computePopoverPlacement({ top: 700, bottom: 740 }, 800);
    expect(placement.side).toBe('top');
    expect(placement.listMaxHeight).toBe(300);
  });

  it('keeps the list inside the viewport when the available room is small on both sides', () => {
    const placement = computePopoverPlacement({ top: 150, bottom: 190 }, 400);
    // 400 - 190 - 8 = 202 below, 142 above: stays below and the list shrinks to fit
    expect(placement).toEqual({ side: 'bottom', listMaxHeight: 162 });
  });

  it('never goes under the minimum usable list height', () => {
    expect(computePopoverPlacement({ top: 60, bottom: 100 }, 140).listMaxHeight).toBe(120);
  });
});

describe('SearchableCombobox', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the previous behavior: opens, filters and selects an option', async () => {
    const onChange = vi.fn();
    render(<SearchableCombobox value={null} onChange={onChange} options={options} />);

    await userEvent.click(screen.getByRole('button', { name: 'Seleccione...' }));
    await userEvent.click(screen.getByRole('option', { name: 'Horneado' }));

    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('opens above the trigger when it sits at the bottom of the viewport', async () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 720, bottom: 760, left: 0, right: 200, width: 200, height: 40, x: 0, y: 720, toJSON: () => ({}),
    });

    const { container } = render(<SearchableCombobox value={null} onChange={vi.fn()} options={options} />);
    await userEvent.click(screen.getByRole('button', { name: 'Seleccione...' }));

    const popover = container.querySelector('[data-side]') as HTMLElement;
    expect(popover).toHaveAttribute('data-side', 'top');
    expect(popover.className).toContain('bottom-full');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('opens below the trigger when there is room', async () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 140, left: 0, right: 200, width: 200, height: 40, x: 0, y: 100, toJSON: () => ({}),
    });

    const { container } = render(<SearchableCombobox value={null} onChange={vi.fn()} options={options} />);
    await userEvent.click(screen.getByRole('button', { name: 'Seleccione...' }));

    expect(container.querySelector('[data-side]')).toHaveAttribute('data-side', 'bottom');
  });
});
