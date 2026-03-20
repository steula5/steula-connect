import * as XLSX from 'xlsx';

// Create a sample Excel file with representatives template
export function generateExcelTemplate() {
  const data = [
    {
      codigo: '88',
      nome: 'ALEXANDRE FREIRE CAMPANELLI - ME',
      rua: 'RUA IRMA FILOMENA 657',
      bairro: 'JACANA',
      cidade: 'SÃO PAULO',
      estado: 'SP',
      cep: '02263-000',
      telefone: '(11)2240-0853',
      email: 'vendas.campanelli@gmail.com',
      observacoes: 'Grande SP. Representadas: STEULA (60%) KRONOS (20%) MAGMA (20%)',
      lat: -23.5505,
      lng: -46.6333,
    },
    {
      codigo: '98',
      nome: 'AUAD E CAMPOS LTDA',
      rua: 'AV. OSVALDO CRUZ 1170',
      bairro: 'CENTRO',
      cidade: 'TRÊS PONTAS',
      estado: 'MG',
      cep: '37185-110',
      telefone: '(35)3265-1477',
      email: 'auadcampostp@gmail.com',
      observacoes: 'Região: Sul de MG (inclui Lavras)',
      lat: -21.3697,
      lng: -45.5142,
    },
    {
      codigo: '43',
      nome: 'DANTAS E BRAGA REPRESENTACOES LTDA',
      rua: 'R. CEL. AMADOR PINHEIRO DE BARROS 35',
      bairro: 'CENTRO',
      cidade: 'MURIAÉ',
      estado: 'MG',
      cep: '36880-030',
      telefone: '(32)3722-4194',
      email: 'dantas@dantasrepresentacoes.com.br',
      observacoes: 'Região: MG - Zona da Mata',
      lat: -21.1306,
      lng: -42.3661,
    },
    {
      codigo: '105',
      nome: 'DIELLI COM. E REPRESENTACOES LTDA',
      rua: 'RUA CEL TABORDA DE MIRANDA 69',
      bairro: 'CIDADE NOVA',
      cidade: 'BELO HORIZONTE',
      estado: 'MG',
      cep: '30130-100',
      telefone: '(31)3284-1234',
      email: 'dielli@dielli.com.br',
      observacoes: 'BH e região metropolitana',
      lat: -19.8267,
      lng: -43.9345,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Representantes');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 10 },  // codigo
    { wch: 35 },  // nome
    { wch: 30 },  // rua
    { wch: 15 },  // bairro
    { wch: 20 },  // cidade
    { wch: 8 },   // estado
    { wch: 12 },  // cep
    { wch: 15 },  // telefone
    { wch: 25 },  // email
    { wch: 40 },  // observacoes
    { wch: 12 },  // lat
    { wch: 12 },  // lng
  ];

  return wb;
}

export function downloadExcelTemplate() {
  const wb = generateExcelTemplate();
  XLSX.writeFile(wb, 'representantes-modelo.xlsx');
}
