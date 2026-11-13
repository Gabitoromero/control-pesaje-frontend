const ESTADO_CLASS: Record<string, string> = {
  Conectado: 'bg-success-muted text-success',
  Encendido: 'bg-warning/10 text-warning',
};

/** Colored pill with the connection state of a device, shared by the list and the detail drawer. */
export const DeviceEstadoBadge = ({ estado }: { estado: string }) => (
  <span
    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      ESTADO_CLASS[estado] ?? 'bg-muted text-muted-foreground'
    }`}
  >
    {estado}
  </span>
);
