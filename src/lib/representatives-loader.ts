/**
 * Script to read and display representatives data from "representantes dados.xlsx"
 * This can be called to load data from the Excel file
 */

import * as XLSX from 'xlsx';
import type { Representative } from '@/types/representative';
import { calculateDistance } from './excel-utils';

export async function loadRepresentativesFromExcelFile(): Promise<Representative[]> {
  try {
    // Try to load from public folder
    const response = await fetch('/representantes dados.xlsx');
    
    if (!response.ok) {
      console.warn('Arquivo de representantes não encontrado no servidor');
      return [];
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!worksheet) {
      console.warn('Nenhuma planilha encontrada no arquivo');
      return [];
    }

    const rows = XLSX.utils.sheet_to_json(worksheet);

    const representatives: Representative[] = rows
      .map((row: any) => {
        // Map Excel columns to Representative interface
        // Handles various potential column name variations
        const rep: Representative = {
          codigo: String(row.codigo || row['Código'] || row['CODIGO'] || '').trim(),
          nome: String(row.nome || row['Nome'] || row['NOME'] || row['name'] || '').trim(),
          rua: String(row.rua || row['Rua'] || row['RUA'] || row['Endereço'] || row['ENDERECO'] || '').trim(),
          bairro: String(row.bairro || row['Bairro'] || row['BAIRRO'] || '').trim(),
          cidade: String(row.cidade || row['Cidade'] || row['CIDADE'] || '').trim(),
          estado: String(row.estado || row['Estado'] || row['ESTADO'] || row['UF'] || row['uf'] || '').trim().toUpperCase(),
          cep: String(row.cep || row['CEP'] || row['Cep'] || row['CEP'] || '').trim(),
          telefone: String(row.telefone || row['Telefone'] || row['TELEFONE'] || row['Tel'] || row['tel'] || '').trim(),
          email: String(row.email || row['Email'] || row['EMAIL'] || row['E-mail'] || '').trim(),
          observacoes: String(row.observacoes || row['Observações'] || row['OBSERVACOES'] || row['Obs'] || row['obs'] || '').trim(),
          lat: parseFloat(String(row.lat || row['Latitude'] || row['LAT'] || row['latitude'] || '')) || undefined,
          lng: parseFloat(String(row.lng || row['Longitude'] || row['LNG'] || row['longitude'] || row['Long'] || '')) || undefined,
        };

        // Validate required fields
        if (!rep.codigo || !rep.nome || !rep.cidade || !rep.estado) {
          return null;
        }

        return rep;
      })
      .filter(Boolean) as Representative[];

    console.log(`✓ Carregados ${representatives.length} representantes do arquivo Excel`);
    return representatives;
  } catch (error) {
    console.error('Erro ao carregar arquivo de representantes:', error);
    return [];
  }
}

/**
 * Export representatives to Excel format
 */
export function exportRepresentativesToExcel(
  representatives: Representative[],
  filename: string = 'representantes.xlsx'
): void {
  try {
    const ws = XLSX.utils.json_to_sheet(representatives);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Representantes');
    XLSX.writeFile(wb, filename);
    console.log(`✓ Arquivo ${filename} exportado com sucesso`);
  } catch (error) {
    console.error('Erro ao exportar representantes:', error);
  }
}

/**
 * Filter representatives by distance from given coordinates
 */
export function filterRepresentativesByDistance(
  representatives: Representative[],
  latitude: number,
  longitude: number,
  maxDistanceKm: number
): Representative[] {
  return representatives
    .map((rep) => {
      if (!rep.lat || !rep.lng) return null;
      const distance = calculateDistance(latitude, longitude, rep.lat, rep.lng);
      if (distance <= maxDistanceKm) {
        return { ...rep, distance };
      }
      return null;
    })
    .filter(Boolean) as (Representative & { distance: number })[];
}

/**
 * Get statistics about representatives
 */
export function getRepresentativesStats(representatives: Representative[]) {
  return {
    total: representatives.length,
    porEstado: representatives.reduce((acc, rep) => {
      acc[rep.estado] = (acc[rep.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    comCoordenas: representatives.filter((r) => r.lat && r.lng).length,
    semEmail: representatives.filter((r) => !r.email).length,
    semTelefone: representatives.filter((r) => !r.telefone).length,
  };
}
