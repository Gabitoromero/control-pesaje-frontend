import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders collapsed by default: title + count badge visible, children hidden', () => {
    render(
      <CollapsibleSection title="Etapas" count={3}>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );

    expect(screen.getByRole('button', { name: /etapas/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // ChevronRight when collapsed (ChevronDown is absent)
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    // Children are hidden from layout when collapsed
    expect(screen.queryByTestId('child-content')).not.toBeVisible();
  });

  it('renders expanded when defaultOpen is true (chevron down, children visible)', () => {
    render(
      <CollapsibleSection title="Etapas" count={2} defaultOpen>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );

    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeVisible();
  });

  it('toggles visibility on header click (collapsed -> expanded -> collapsed)', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Etapas" count={1}>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );

    const toggle = screen.getByRole('button', { name: /etapas/i });
    expect(screen.getByTestId('child-content')).not.toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByTestId('child-content')).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByTestId('child-content')).not.toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('exposes aria-expanded and aria-controls referencing the content region', () => {
    render(
      <CollapsibleSection title="Artículos" count={0}>
        <div>child</div>
      </CollapsibleSection>
    );

    const toggle = screen.getByRole('button', { name: /artículos/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const controlsId = toggle.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    const region = screen.getByRole('region');
    expect(region.id).toBe(controlsId);
  });

  it('count badge renders regardless of collapsed/expanded state', () => {
    const { rerender } = render(
      <CollapsibleSection title="Etapas" count={5}>
        <div>child</div>
      </CollapsibleSection>
    );
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(
      <CollapsibleSection title="Etapas" count={5} defaultOpen>
        <div>child</div>
      </CollapsibleSection>
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('forceOpen false->true expands the section automatically', async () => {
    const { rerender } = render(
      <CollapsibleSection title="Etapas" count={1} forceOpen={false}>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );
    expect(screen.getByTestId('child-content')).not.toBeVisible();

    rerender(
      <CollapsibleSection title="Etapas" count={1} forceOpen>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );
    expect(screen.getByTestId('child-content')).toBeVisible();
    expect(screen.getByRole('button', { name: /etapas/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('forceOpen allows the user to re-collapse after auto-expand', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CollapsibleSection title="Etapas" count={1} forceOpen={false}>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );

    rerender(
      <CollapsibleSection title="Etapas" count={1} forceOpen>
        <div data-testid="child-content">child</div>
      </CollapsibleSection>
    );
    expect(screen.getByTestId('child-content')).toBeVisible();

    // User re-collapses while forceOpen stays true — section must stay collapsed
    await user.click(screen.getByRole('button', { name: /etapas/i }));
    expect(screen.getByTestId('child-content')).not.toBeVisible();
    expect(screen.getByRole('button', { name: /etapas/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with count 0 badge', () => {
    render(
      <CollapsibleSection title="Artículos" count={0}>
        <div>child</div>
      </CollapsibleSection>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
