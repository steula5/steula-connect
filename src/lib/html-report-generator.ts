import type { Representative } from '@/types/representative';

export function generateHTMLReport(representatives: Representative[]): string {
  const timestamp = new Date().toLocaleString('pt-BR');
  
  const repRows = representatives
    .map(
      (rep) => `
    <tr>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.codigo}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm font-medium">${rep.nome}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.rua}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.bairro}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.cidade}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm font-semibold">${rep.estado}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.cep || '-'}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.telefone || '-'}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm">${rep.email || '-'}</td>
      <td class="border border-gray-300 px-3 py-2 text-xs">${rep.observacoes || '-'}</td>
    </tr>
  `
    )
    .join('');

  const statsByState = representatives.reduce(
    (acc, rep) => {
      acc[rep.estado] = (acc[rep.estado] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const stateStatsRows = Object.entries(statsByState)
    .map(
      ([state, count]) => `
    <tr>
      <td class="border border-gray-300 px-3 py-2 text-sm">${state}</td>
      <td class="border border-gray-300 px-3 py-2 text-sm font-semibold text-center">${count}</td>
    </tr>
  `
    )
    .join('');

  // Generate map markers as coordinates
  const markers = representatives
    .filter((r) => r.lat && r.lng)
    .map((r) => `[${r.lat}, ${r.lng}, "${r.nome.replace(/"/g, '&quot;')}"]`)
    .join(',\n    ');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Steula - Relatório de Cobertura de Representantes</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }
    
    .header {
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      color: #0066cc;
      margin-bottom: 5px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .timestamp {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-box {
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-box .number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-box .label {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 20px;
      color: #0066cc;
      margin-bottom: 15px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    thead {
      background-color: #0066cc;
      color: white;
    }
    
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    td {
      padding: 10px;
      font-size: 13px;
    }
    
    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    tbody tr:hover {
      background-color: #f0f0f0;
    }
    
    .map-container {
      width: 100%;
      height: 500px;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><rect fill="%23e0e0e0" width="300" height="150"/></svg>');
      background-size: cover;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .map-info {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      color: #666;
    }
    
    .map-info p {
      margin-bottom: 10px;
    }
    
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .dot-presencial { background-color: #10b981; }
    .dot-possivel-tlv { background-color: #f59e0b; }
    .dot-nao-atendida { background-color: #ef4444; }
    .dot-abandono { background-color: #ef4444; }
    
    .footer {
      border-top: 2px solid #ddd;
      padding-top: 20px;
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
      }
      .container {
        max-width: 100%;
        padding: 20px;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Steula — Supervisão Comercial</h1>
      <p>Relatório de Cobertura de Representantes</p>
      <div class="timestamp">Gerado em: ${timestamp}</div>
    </div>

    <!-- Statistics -->
    <div class="stats">
      <div class="stat-box">
        <div class="number">${representatives.length}</div>
        <div class="label">Representantes</div>
      </div>
      <div class="stat-box" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);">
        <div class="number">${Object.keys(statsByState).length}</div>
        <div class="label">Estados</div>
      </div>
      <div class="stat-box" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
        <div class="number">${representatives.filter((r) => r.lat && r.lng).length}</div>
        <div class="label">Com Coordenadas</div>
      </div>
    </div>

    <!-- Map Section -->
    <div class="section">
      <h2>📍 Distribuição Geográfica</h2>
      <div class="map-container">
        <div class="map-info">
          <p><strong>Mapa de Representantes</strong></p>
          <p style="font-size: 12px;">Visualização dos ${representatives.length} representantes carregados</p>
          <p style="font-size: 12px; color: #999;">Coordenadas registradas: ${representatives.filter((r) => r.lat && r.lng).length}</p>
        </div>
      </div>
      
      <div class="legend">
        <div class="legend-item">
          <div class="legend-dot dot-nao-atendida"></div>
          <span>Áreas Não Atendidas</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot dot-presencial"></div>
          <span>Atendimento Presencial (≤ 150 km)</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot dot-possivel-tlv"></div>
          <span>Atendimento Possível TLV (151–300 km)</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot dot-abandono"></div>
          <span>Zona de Abandono (> 300 km)</span>
        </div>
      </div>
    </div>

    <!-- Estado Summary -->
    <div class="section">
      <h2>📈 Resumo por Estado</h2>
      <table>
        <thead>
          <tr>
            <th>Estado</th>
            <th style="text-align: center;">Representantes</th>
          </tr>
        </thead>
        <tbody>
          ${stateStatsRows}
        </tbody>
      </table>
    </div>

    <!-- Detailed Table -->
    <div class="section page-break">
      <h2>📋 Detalhes dos Representantes</h2>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Rua</th>
            <th>Bairro</th>
            <th>Cidade</th>
            <th>Estado</th>
            <th>CEP</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          ${repRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Steula — Sistema de Supervisão Comercial</p>
      <p>Este relatório foi gerado automaticamente. Para atualizações, reimporte os dados na aplicação.</p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadHTMLReport(representatives: Representative[], filename?: string) {
  const html = generateHTMLReport(representatives);
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `steula-relatorio-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
