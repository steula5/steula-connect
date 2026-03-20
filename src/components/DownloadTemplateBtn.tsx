import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadExcelTemplate } from '@/lib/excel-template';

export function DownloadTemplateBtn() {
  const handleDownloadCSV = async () => {
    try {
      const response = await fetch('/representantes-modelo.csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'representantes-modelo.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Arquivo CSV baixado!');
    } catch (error) {
      toast.error('Erro ao baixar o arquivo CSV');
      console.error('Download error:', error);
    }
  };

  const handleDownloadExcel = () => {
    try {
      downloadExcelTemplate();
      toast.success('Arquivo Excel baixado!');
    } catch (error) {
      toast.error('Erro ao baixar o arquivo Excel');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Modelo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={handleDownloadCSV}>
            <FileText className="mr-2 h-4 w-4" />
            <span>CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadExcel}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground">
        Edite e importe os dados dos representantes
      </p>
    </div>
  );
}
