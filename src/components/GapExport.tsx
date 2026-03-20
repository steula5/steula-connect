import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Representative } from '@/types/representative';
import { BRAZIL_CAPITALS, BRAZIL_STATES, haversineDistance, getZone } from '@/lib/geo-utils';

interface GapExportProps {
  representatives: Representative[];
}

export function GapExport({ representatives }: GapExportProps) {
  const handleExport = () => {
    const lines = ['Representante,Cidades Atendidas,Estados Cobertos,Estados Descobertos'];

    for (const rep of representatives) {
      if (rep.lat == null || rep.lng == null) continue;

      const cidadesAtendidas: string[] = [];
      const estadosCobertos = new Set<string>();

      for (const cap of BRAZIL_CAPITALS) {
        const dist = haversineDistance(rep.lat, rep.lng, cap.lat, cap.lng);
        if (dist <= 300) {
          cidadesAtendidas.push(`${cap.cidade} (${Math.round(dist)}km)`);
          estadosCobertos.add(cap.estado);
        }
      }

      const descobertos = BRAZIL_STATES.filter(s => !estadosCobertos.has(s));

      lines.push(
        `"${rep.nome}","${cidadesAtendidas.join('; ')}","${[...estadosCobertos].join('; ')}","${descobertos.join('; ')}"`
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_gaps_steula.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2" disabled={representatives.length === 0}>
      <Download className="h-4 w-4" />
      Exportar Gaps (CSV)
    </Button>
  );
}
