import { generateHTMLReport } from './html-report-generator';
import type { Representative } from '@/types/representative';

/**
 * Converts HTML to PDF using html2pdf library
 * Note: This requires html2pdf to be installed
 */
export async function generatePDFReport(representatives: Representative[]) {
  const html = generateHTMLReport(representatives);
  
  // For now, we'll use the browser's print functionality
  // To use html2pdf, install it with: npm install html2pdf.js
  
  const printWindow = window.open('', '', 'height=800,width=1000');
  if (!printWindow) {
    throw new Error('Pop-up blocker prevented opening print window');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load before printing
  printWindow.onload = function () {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Sends HTML report via email using mailto
 */
export function sendViaEmail(representatives: Representative[]) {
  const html = generateHTMLReport(representatives);
  const subject = `Steula - Relatório de Cobertura de Representantes - ${new Date().toLocaleDateString('pt-BR')}`;
  const body = `Segue em anexo o relatório de cobertura de representantes.\n\nGerado em: ${new Date().toLocaleString('pt-BR')}\nTotal de representantes: ${representatives.length}`;
  
  // Note: mailto with large attachments won't work
  // This is just for composition, the actual file needs to be attached manually
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}

/**
 * Copy HTML to clipboard so user can paste in email
 */
export async function copyHTMLToClipboard(representatives: Representative[]) {
  const html = generateHTMLReport(representatives);
  
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Create a blob from HTML content
 */
export function getHTMLBlob(representatives: Representative[]): Blob {
  const html = generateHTMLReport(representatives);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}
