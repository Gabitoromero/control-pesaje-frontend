import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/AuthContext';
import { getLinea } from '../../../api/lineas';
import { HistorialContent } from '../components/HistorialContent';
import { TabletPlantaHeader } from '../components/TabletPlantaHeader';
import { useTabletLogout } from '../hooks/useTabletLogout';

export function HistorialPage() {
  const { activeLineaId } = useAuth();
  const handleLogout = useTabletLogout();

  const { data: linea } = useQuery({
    queryKey: ['linea', activeLineaId],
    queryFn: () => getLinea(activeLineaId!),
    enabled: !!activeLineaId,
  });

  return (
    <div data-testid="tablet-page-root" className="h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden">
      <TabletPlantaHeader lineaNombre={linea?.nombre ?? `Línea ${activeLineaId}`} onLogout={handleLogout} />

      <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto space-y-6">
        <HistorialContent />
      </main>
    </div>
  );
}
