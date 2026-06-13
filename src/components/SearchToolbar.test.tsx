import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchToolbar } from './SearchToolbar';

describe('SearchToolbar', () => {
  const defaultFields = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'descripcion', label: 'Descripción' }
  ];

  it('renders with external state', () => {
    render(
      <SearchToolbar
        status="activo"
        onStatusChange={vi.fn()}
        fields={defaultFields}
        field="nombre"
        onFieldChange={vi.fn()}
        query=""
        onQueryChange={vi.fn()}
      />
    );

    const statusSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(statusSelect.value).toBe('activo');

    const fieldSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    expect(fieldSelect.value).toBe('nombre');

    const queryInput = screen.getByPlaceholderText('Buscar...') as HTMLInputElement;
    expect(queryInput.value).toBe('');
  });

  it('status change is delegated to parent', () => {
    const onStatusChange = vi.fn();
    render(
      <SearchToolbar
        status="activo"
        onStatusChange={onStatusChange}
        fields={defaultFields}
        field="nombre"
        onFieldChange={vi.fn()}
        query=""
        onQueryChange={vi.fn()}
      />
    );

    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'inactivo' } });
    expect(onStatusChange).toHaveBeenCalledWith('inactivo');
  });

  it('field change is delegated to parent', () => {
    const onFieldChange = vi.fn();
    render(
      <SearchToolbar
        status="activo"
        onStatusChange={vi.fn()}
        fields={defaultFields}
        field="nombre"
        onFieldChange={onFieldChange}
        query=""
        onQueryChange={vi.fn()}
      />
    );

    const fieldSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(fieldSelect, { target: { value: 'descripcion' } });
    expect(onFieldChange).toHaveBeenCalledWith('descripcion');
  });

  it('query change is delegated to parent', () => {
    const onQueryChange = vi.fn();
    render(
      <SearchToolbar
        status="activo"
        onStatusChange={vi.fn()}
        fields={defaultFields}
        field="nombre"
        onFieldChange={vi.fn()}
        query=""
        onQueryChange={onQueryChange}
      />
    );

    const queryInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(queryInput, { target: { value: 'abc' } });
    expect(onQueryChange).toHaveBeenCalledWith('abc');
  });

  it('has no Todos option in status dropdown', () => {
    render(
      <SearchToolbar
        status="activo"
        onStatusChange={vi.fn()}
        fields={defaultFields}
        field="nombre"
        onFieldChange={vi.fn()}
        query=""
        onQueryChange={vi.fn()}
      />
    );

    const statusSelect = screen.getAllByRole('combobox')[0];
    const options = Array.from(statusSelect.querySelectorAll('option')).map(o => o.value);
    expect(options).toEqual(['activo', 'inactivo']);
  });

  it('fields prop drives options', () => {
    render(
      <SearchToolbar
        status="activo"
        onStatusChange={vi.fn()}
        fields={defaultFields}
        field="nombre"
        onFieldChange={vi.fn()}
        query=""
        onQueryChange={vi.fn()}
      />
    );

    const fieldSelect = screen.getAllByRole('combobox')[1];
    const options = Array.from(fieldSelect.querySelectorAll('option')).map(o => ({
      value: o.value,
      label: o.textContent
    }));
    expect(options).toEqual([
      { value: 'nombre', label: 'Nombre' },
      { value: 'descripcion', label: 'Descripción' }
    ]);
  });
});
