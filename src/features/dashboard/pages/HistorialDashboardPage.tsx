import { HistorialContent } from '../../tablet/components/HistorialContent';

/** Muestras history reachable from the dashboard sidebar, so it doesn't need a line session. */
export function HistorialDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Historial</h1>
      <HistorialContent />
    </div>
  );
}
