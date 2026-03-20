export interface Representative {
  codigo: string;
  nome: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  email: string;
  telefone: string;
  lat?: number;
  lng?: number;
}

export type CoverageZone = 'presencial' | 'hibrido' | 'abandono';

export interface CoverageData {
  representante: string;
  cidade: string;
  estado: string;
  distanciaKm: number;
  zona: CoverageZone;
}

export interface GapReport {
  representante: string;
  cidadesAtendidas: string[];
  estadosCobertos: string[];
  estadosDescobertos: string[];
}
