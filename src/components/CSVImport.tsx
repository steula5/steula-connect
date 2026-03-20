import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Representative } from '@/types/representative';
import { geocodeFromCity, geocodeRepresentative } from '@/lib/geo-utils';

interface CSVImportProps {
  onImport: (data: Representative[]) => void;
}

export function CSVImport({ onImport }: CSVImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setIsGeocoding(true);
        
        interface TempRep extends Representative {
          _needsGeocoding?: boolean;
          _rua?: string;
          _bairro?: string;
        }

        const reps: TempRep[] = results.data.map((row: any) => {
          const estado = (row['Estado'] || row['estado'] || row['UF'] || row['uf'] || '').trim().toUpperCase();
          const cidade = (row['Cidade'] || row['cidade'] || '').trim();
          
          // Try to get coordinates from file first
          const latStr = row['Latitude'] || row['latitude'] || row['Lat'] || row['lat'];
          const lngStr = row['Longitude'] || row['longitude'] || row['Lng'] || row['lng'] || row['Long'] || row['long'];
          const latNum = latStr ? parseFloat(String(latStr)) : undefined;
          const lngNum = lngStr ? parseFloat(String(lngStr)) : undefined;
          
          let lat = (latNum && !isNaN(latNum)) ? latNum : undefined;
          let lng = (lngNum && !isNaN(lngNum)) ? lngNum : undefined;
          
          return {
            codigo: (row['Codigo'] || row['codigo'] || row['Código'] || '').trim(),
            nome: (row['Nome'] || row['nome'] || '').trim(),
            rua: (row['Rua'] || row['rua'] || row['Endereço'] || '').trim(),
            bairro: (row['Bairro'] || row['bairro'] || '').trim(),
            cidade,
            estado,
            cep: (row['CEP'] || row['cep'] || '').trim(),
            observacoes: (row['Observacoes'] || row['observacoes'] || row['Observações'] || '').trim(),
            email: (row['Email'] || row['email'] || row['E-mail'] || '').trim(),
            telefone: (row['Telefone'] || row['telefone'] || '').trim(),
            lat,
            lng,
            _needsGeocoding: !lat || !lng,
            _rua: (row['Rua'] || row['rua'] || row['Endereço'] || '').trim(),
            _bairro: (row['Bairro'] || row['bairro'] || '').trim(),
          } as TempRep;
        }).filter(r => r.nome) as TempRep[];

        // Geocode representatives that don't have coordinates
        const repsNeedingGeocode = reps.filter(r => r._needsGeocoding);
        
        if (repsNeedingGeocode.length > 0) {
          console.log(`Geocodificando ${repsNeedingGeocode.length} representantes do CSV...`);
          
          // Process geocoding for each representative
          for (const rep of repsNeedingGeocode) {
            const coords = await geocodeRepresentative(
              rep._rua,
              rep._bairro,
              rep.cidade,
              rep.estado
            );
            if (coords) {
              rep.lat = coords.lat;
              rep.lng = coords.lng;
            }
            // Add small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Clean up temporary fields
        const cleanReps = reps.map(({ _needsGeocoding, _rua, _bairro, ...rep }) => rep) as Representative[];
        
        setIsGeocoding(false);
        onImport(cleanReps);
      },
    });
  }, [onImport]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        className="gap-2"
        disabled={isGeocoding}
      >
        {isGeocoding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Geocodificando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Importar CSV
          </>
        )}
      </Button>
    </div>
  );
}
