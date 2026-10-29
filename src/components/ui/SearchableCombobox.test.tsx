import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableCombobox } from './SearchableCombobox';

const numericOptions = [
  { id: 1, nombre: 'Amasado' },
  { id: 2, nombre: 'Envasado' },
  { id: 3, nombre: 'Horneado' },
];

const stringOptions = [
  { id: 'OPERARIO', nombre: 'Operario' },
  { id: 'ADMIN', nombre: 'Administrador' },
];

const renderCombobox = (props: Partial<React.ComponentProps<typeof SearchableCombobox>> = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <SearchableCombobox
      value={null}
      onChange={onChange}
      options={numericOptions}
      placeholder="Buscar etapa..."
      {...props}
    />
  );
  return { onChange, ...utils };
};

const trigger = () => screen.getByRole('button', { name: /Seleccione\.\.\.|Amasado|Envasado|Operario/ });

describe('SearchableCombobox', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows "Seleccione..." when value is null and renders no combobox/option while closed', () => {
    renderCombobox();
    expect(screen.getByText('Seleccione...')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the nombre of the option matching value when closed', () => {
    renderCombobox({ value: 2 });
    expect(screen.getByRole('button', { name: 'Envasado' })).toBeInTheDocument();
    expect(screen.queryByText('Seleccione...')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('opens a dialog with the search input (placeholder) and every option', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(trigger());

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar etapa...')).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Amasado', 'Envasado', 'Horneado']);
  });

  it('moves the initial focus to the search input', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(trigger());

    const input = await screen.findByPlaceholderText('Buscar etapa...');
    expect(input).toHaveFocus();
  });

  it('filters the options while typing and shows the empty message when nothing matches', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(trigger());
    const input = await screen.findByPlaceholderText('Buscar etapa...');

    await user.type(input, 'Envas');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Envasado']);
    expect(screen.queryByText('No se encontraron resultados.')).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'zzz');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.getByText('No se encontraron resultados.')).toBeInTheDocument();
  });

  it('calls onChange once with the numeric id when clicking an option and closes the popup', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(trigger());
    await user.click(await screen.findByRole('option', { name: 'Envasado' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('calls onChange once with the string id when clicking an option and closes the popup', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ options: stringOptions, value: 'OPERARIO' });
    await user.click(screen.getByRole('button', { name: 'Operario' }));
    await user.click(await screen.findByRole('option', { name: /Administrador/ }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('ADMIN');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('selects with the keyboard (ArrowDown + Enter) and closes the popup', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(trigger());
    await screen.findByPlaceholderText('Buscar etapa...');

    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with Escape without calling onChange and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(trigger());
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Seleccione...' })).toHaveFocus();
  });

  it('resets the search text when reopened', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(trigger());
    await user.type(await screen.findByPlaceholderText('Buscar etapa...'), 'Amas');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Escape}');

    await user.click(trigger());
    const input = await screen.findByPlaceholderText('Buscar etapa...');
    expect(input).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('shows the "Seleccionado" block with the full nombre when value matches an option', async () => {
    const user = userEvent.setup();
    const longName = '[COD-0001] Masa madre de centeno integral con semillas';
    renderCombobox({ value: 7, options: [{ id: 7, nombre: longName }, ...numericOptions] });
    await user.click(screen.getByRole('button', { name: longName }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Seleccionado')).toBeInTheDocument();
    // the block repeats the name; the list row keeps the option listed too
    expect(within(dialog).getAllByText(longName)).toHaveLength(2);
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('does not show the "Seleccionado" block when value is null', async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(trigger());
    await screen.findByRole('dialog');

    expect(screen.queryByText('Seleccionado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar selección' })).not.toBeInTheDocument();
  });

  it('with clearable, the popup X calls onChange(null) and keeps the popup open', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ value: 2, clearable: true });
    await user.click(screen.getByRole('button', { name: 'Envasado' }));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Quitar selección' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('with clearable, the trigger inline X calls onChange(null) without opening the popup', async () => {
    const user = userEvent.setup();
    const { onChange, container } = renderCombobox({ value: 2, clearable: true });
    const inlineX = container.querySelectorAll('button')[1];

    await user.click(inlineX);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('without clearable there is no X to remove the selection (trigger nor popup)', async () => {
    const user = userEvent.setup();
    const { container } = renderCombobox({ value: 2 });
    expect(container.querySelectorAll('button')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Envasado' }));
    await screen.findByRole('dialog');

    expect(screen.getByText('Seleccionado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar selección' })).not.toBeInTheDocument();
  });

  it('never marks an option without id as selected and does not call onChange when chosen', async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ value: null, options: [{ nombre: 'Sin id' }, ...numericOptions] });
    expect(screen.getByText('Seleccione...')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Seleccione...' }));
    await screen.findByRole('dialog');
    expect(screen.queryByText('Seleccionado')).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Sin id' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not submit an enclosing form when clicking trigger, option or X', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <SearchableCombobox value={2} onChange={onChange} options={numericOptions} clearable />
      </form>
    );

    await user.click(screen.getByRole('button', { name: 'Envasado' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Quitar selección' }));
    await user.click(screen.getByRole('option', { name: 'Horneado' }));

    expect(onChange).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('emits no console warnings or errors (e.g. Radix title/description) when opened', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCombobox();
    await user.click(trigger());
    await screen.findByRole('dialog');

    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
