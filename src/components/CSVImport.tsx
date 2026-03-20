import { useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Representative } from '@/types/representative';
import { geocodeFromCity } from '@/lib/geo-utils';

interface CSVImportProps {
  onImport: (data: Representative[]) => void;
}

export function CSVImport({ onImport }: CSVImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const reps: Representative[] = results.data.map((row: any) => {
          const estado = (row['Estado'] || row['estado'] || '').trim();
          const cidade = (row['Cidade'] || row['cidade'] || '').trim();
          const geo = geocodeFromCity(cidade, estado);
          return {
            codigo: row['Codigo'] || row['codigo'] || row['Código'] || '',
            nome: row['Nome'] || row['nome'] || '',
            rua: row['Rua'] || row['rua'] || row['Endereço'] || '',
            bairro: row['Bairro'] || row['bairro'] || '',
            cidade,
            estado,
            cep: row['CEP'] || row['cep'] || '',
            observacoes: row['Observacoes'] || row['observacoes'] || row['Observações'] || '',
            email: row['Email'] || row['email'] || row['E-mail'] || '',
            telefone: row['Telefone'] || row['telefone'] || '',
            lat: geo?.lat,
            lng: geo?.lng,
          };
        });
        onImport(reps.filter(r => r.nome));
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
      >
        <Upload className="h-4 w-4" />
        Importar CSV
      </Button>
    </div>
  );
}
