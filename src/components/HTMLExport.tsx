import { Download, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadHTMLReport } from '@/lib/html-report-generator';
import { generatePDFReport, sendViaEmail } from '@/lib/report-exporters';
import type { Representative } from '@/types/representative';

interface HTMLExportProps {
  representatives: Representative[];
}

export function HTMLExport({ representatives }: HTMLExportProps) {
  const handleExportHTML = () => {
    if (representatives.length === 0) {
      toast.error('Nenhum representante para exportar');
      return;
    }

    try {
      downloadHTMLReport(representatives);
      toast.success('Relatório HTML exportado! Você pode enviar por email.');
    } catch (error) {
      toast.error('Erro ao exportar relatório HTML');
      console.error('Export error:', error);
    }
  };

  const handlePrint = () => {
    if (representatives.length === 0) {
      toast.error('Nenhum representante para imprimir');
      return;
    }

    try {
      generatePDFReport(representatives);
    } catch (error) {
      toast.error('Erro ao abrir janela de impressão');
      console.error('Print error:', error);
    }
  };

  const handleEmail = () => {
    if (representatives.length === 0) {
      toast.error('Nenhum representante para enviar');
      return;
    }

    try {
      // Show message to user
      toast.info('1. Exporte como HTML\n2. Anexe o arquivo ao email');
      handleExportHTML();
    } catch (error) {
      toast.error('Erro ao preparar email');
      console.error('Email error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={representatives.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportHTML}>
          <Download className="mr-2 h-4 w-4" />
          <span>HTML Monolítico</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          <span>Imprimir/PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmail}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Para Email</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
