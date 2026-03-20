import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Representative } from '@/types/representative';
import { BRAZIL_CAPITALS, haversineDistance, getZone, ZONE_LABELS } from '@/lib/geo-utils';
import { useMemo } from 'react';

interface CoverageTableProps {
  representatives: Representative[];
}

interface CoverageRow {
  repNome: string;
  repCodigo: string;
  cidade: string;
  estado: string;
  distancia: number;
  zona: string;
}

export function CoverageTable({ representatives }: CoverageTableProps) {
  const rows = useMemo(() => {
    const result: CoverageRow[] = [];
    for (const rep of representatives) {
      if (rep.lat == null || rep.lng == null) continue;
      for (const cap of BRAZIL_CAPITALS) {
        const dist = haversineDistance(rep.lat, rep.lng, cap.lat, cap.lng);
        if (dist <= 300) {
          result.push({
            repNome: rep.nome,
            repCodigo: rep.codigo,
            cidade: cap.cidade,
            estado: cap.estado,
            distancia: Math.round(dist),
            zona: getZone(dist),
          });
        }
      }
    }
    return result.sort((a, b) => a.distancia - b.distancia);
  }, [representatives]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Importe um CSV para ver a tabela de cobertura.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Representante</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Distância (km)</TableHead>
            <TableHead>Zona</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.repCodigo}-${row.cidade}-${i}`}>
              <TableCell className="font-medium">{row.repNome}</TableCell>
              <TableCell>{row.cidade}</TableCell>
              <TableCell>{row.estado}</TableCell>
              <TableCell className="text-right tabular-nums">{row.distancia}</TableCell>
              <TableCell>
                <span className={`zone-badge-${row.zona}`}>
                  {row.zona === 'presencial' ? '● Presencial' : row.zona === 'hibrido' ? '● Híbrido' : '● Abandono'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
