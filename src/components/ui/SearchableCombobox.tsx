import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { X } from 'lucide-react';

export const SearchableCombobox = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Buscar...",
  clearable = false 
}: { 
  value: number | string | null; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (val: any) => void; 
  options: { id?: number | string; nombre: string }[]; 
  placeholder?: string;
  clearable?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.id === value)?.nombre || 'Seleccione...';

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring text-foreground">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 text-left truncate outline-none"
        >
          {selectedLabel}
        </button>
        {clearable && value !== null && value !== undefined && value !== '' && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(null);
            }}
            className="ml-2 text-muted-foreground hover:text-foreground focus:outline-none flex-none"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <Command>
            <CommandInput 
              placeholder={placeholder} 
              className="flex h-10 w-full rounded-md bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground" 
            />
            <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 bg-popover">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.nombre}
                    onSelect={() => {
                      if (opt.id !== undefined) {
                        onChange(opt.id);
                      }
                      setOpen(false);
                    }}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    {opt.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
