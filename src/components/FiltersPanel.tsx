import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BRAZIL_STATES } from '@/lib/geo-utils';
import type { Representative } from '@/types/representative';

interface FiltersPanelProps {
  representatives: Representative[];
  selectedState: string;
  selectedRep: string;
  onStateChange: (v: string) => void;
  onRepChange: (v: string) => void;
}

export function FiltersPanel({ representatives, selectedState, selectedRep, onStateChange, onRepChange }: FiltersPanelProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={selectedState} onValueChange={onStateChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estados</SelectItem>
          {BRAZIL_STATES.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedRep} onValueChange={onRepChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Filtrar por representante" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os representantes</SelectItem>
          {representatives.map(r => (
            <SelectItem key={r.codigo} value={r.codigo}>{r.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
