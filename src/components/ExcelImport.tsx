import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Representative } from '@/types/representative';
import { readExcelRepresentatives } from '@/lib/excel-utils';

interface ExcelImportProps {
  onImport: (data: Representative[]) => void;
}

export function ExcelImport({ onImport }: ExcelImportProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is Excel format
    const isExcel = 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!isExcel) {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setLoading(true);
    try {
      const representatives = await readExcelRepresentatives(file);
      
      if (representatives.length === 0) {
        toast.error('Nenhum representante encontrado no arquivo');
        return;
      }

      onImport(representatives);
      setSuccess(true);
      toast.success(`${representatives.length} representantes carregados e geocodificados com sucesso!`);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar o arquivo';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {success ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Importado!
          </>
        ) : loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Geocodificando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Importar Excel
          </>
        )}
      </Button>
    </div>
  );
}
