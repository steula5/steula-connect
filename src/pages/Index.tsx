import { useState, useMemo } from 'react';
import { MapPin, Users, BarChart3, ChevronRight, ChevronLeft } from 'lucide-react';
import { CSVImport } from '@/components/CSVImport';
import { ExcelImport } from '@/components/ExcelImport';
import { HTMLExport } from '@/components/HTMLExport';
import { CEPSearch } from '@/components/CEPSearch';
import { CoverageMap } from '@/components/CoverageMap';
import { FiltersPanel } from '@/components/FiltersPanel';
import { CoverageTable } from '@/components/CoverageTable';
import { GapExport } from '@/components/GapExport';
import { DownloadTemplateBtn } from '@/components/DownloadTemplateBtn';
import { Button } from '@/components/ui/button';
import type { Representative } from '@/types/representative';

export default function Index() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [selectedState, setSelectedState] = useState('all');
  const [selectedRep, setSelectedRep] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filtered = useMemo(() => {
    return representatives.filter(r => {
      if (selectedState !== 'all' && r.estado.toUpperCase() !== selectedState) return false;
      if (selectedRep !== 'all' && r.codigo !== selectedRep) return false;
      return true;
    });
  }, [representatives, selectedState, selectedRep]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Steula — Supervisão Comercial</h1>
              <p className="text-xs text-muted-foreground">Cobertura de Representantes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HTMLExport representatives={representatives} />
            <GapExport representatives={filtered} />
            <ExcelImport onImport={setRepresentatives} />
            <CSVImport onImport={setRepresentatives} />
          </div>
        </div>
      </header>

      {/* Stats */}
      {representatives.length > 0 && (
        <div className="border-b bg-card px-6 py-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{filtered.length}</span>
              <span className="text-muted-foreground">representantes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{new Set(filtered.map(r => r.estado)).size}</span>
              <span className="text-muted-foreground">estados</span>
            </div>
            <div className="ml-auto">
              <FiltersPanel
                representatives={representatives}
                selectedState={selectedState}
                selectedRep={selectedRep}
                onStateChange={setSelectedState}
                onRepChange={setSelectedRep}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`border-r bg-card transition-all duration-300 overflow-y-auto z-40 ${
            sidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          {sidebarOpen && (
            <div className="p-4">
              <CEPSearch representatives={representatives} />
            </div>
          )}
        </aside>

        {/* Toggle sidebar button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-none border-r"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Main content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="max-w-6xl space-y-6">
          {/* Map */}
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm" style={{ height: '500px' }}>
            {representatives.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-muted-foreground">
                <MapPin className="h-12 w-12 opacity-30" />
                <div className="text-center space-y-2">
                  <p className="font-medium text-foreground">Nenhum representante carregado</p>
                  <p className="text-sm">Importe um arquivo CSV ou Excel para visualizar a cobertura no mapa.</p>
                  <div className="pt-2">
                    <DownloadTemplateBtn />
                  </div>
                </div>
              </div>
            ) : (
              <CoverageMap representatives={filtered} />
            )}
          </div>

          {/* Legend */}
          {representatives.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">● Áreas Não Atendidas</span>
              <span className="zone-badge-presencial">● Atendimento Presencial (≤ 150 km)</span>
              <span className="zone-badge-possivel-tlv">● Atendimento Possível TLV (151–300 km)</span>
              <span className="zone-badge-abandono">● Zona de Abandono ({'>'} 300 km)</span>
            </div>
          )}

          {/* Coverage Table */}
          <div>
            <h2 className="mb-3 text-base font-semibold">Tabela de Cobertura</h2>
            <CoverageTable representatives={filtered} />
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
