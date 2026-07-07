export type SearchField = { value: string; label: string };

export interface SearchToolbarProps {
  status: 'activo' | 'inactivo';
  onStatusChange: (s: 'activo' | 'inactivo') => void;
  fields: SearchField[];
  field: string;
  onFieldChange: (f: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

export function SearchToolbar({
  status,
  onStatusChange,
  fields,
  field,
  onFieldChange,
  query,
  onQueryChange,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4">
      <select
        className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as 'activo' | 'inactivo')}
      >
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>

      <select
        className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        value={field}
        onChange={(e) => onFieldChange(e.target.value)}
      >
        {fields.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <input
        className="flex-1 min-w-[12rem] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Buscar..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
    </div>
  );
}
