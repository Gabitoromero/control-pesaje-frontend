import { useRef, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';

export const SearchableCombobox = ({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  clearable = false,
  emptyLabel = 'Seleccione...'
}: {
  value: number | string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (val: any) => void;
  options: { id?: number | string; nombre: string }[];
  placeholder?: string;
  clearable?: boolean;
  /** Text of the closed field while nothing is selected. */
  emptyLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Options without id can never be "selected" (avoids undefined === undefined when value is null).
  const selectedOption =
    value === null || value === undefined ? undefined : options.find((o) => o.id !== undefined && o.id === value);
  const selectedLabel = selectedOption?.nombre || emptyLabel;

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm shadow-sm has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-ring text-foreground">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex flex-col gap-0 p-0 w-[calc(100vw-1rem)] max-w-none h-[calc(100dvh-1rem)] sm:max-w-2xl sm:h-[80dvh] bg-popover text-popover-foreground overflow-hidden"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">Seleccionar opción</DialogTitle>
          <DialogDescription className="sr-only">
            Escriba para filtrar las opciones y elija una de la lista.
          </DialogDescription>
          <Command className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border p-3 pr-12">
              <CommandInput
                ref={inputRef}
                placeholder={placeholder}
                className="flex h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
            {selectedOption && (
              <div className="flex items-start gap-3 border-b border-border bg-accent/40 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Seleccionado</span>
                  <p className="mt-0.5 break-words text-sm font-medium text-foreground">{selectedOption.nombre}</p>
                </div>
                {clearable && (
                  <button
                    type="button"
                    aria-label="Quitar selección"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(null);
                    }}
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <CommandList className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                {options.map((opt, index) => (
                  <CommandItem
                    key={opt.id ?? `sin-id-${index}`}
                    value={opt.nombre}
                    onSelect={() => {
                      if (opt.id !== undefined) {
                        onChange(opt.id);
                      }
                      setOpen(false);
                    }}
                    className="relative flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="min-w-0 flex-1 break-words">{opt.nombre}</span>
                    {selectedOption === opt && <Check size={16} aria-hidden="true" className="flex-none text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
};
