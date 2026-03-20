# 📍 Guia de Uso - Busca por CEP e Import de Representantes

## Novas Funcionalidades Implementadas

### 1. 🔍 Barra Lateral de Busca por CEP

A barra lateral (sidebar) permite que você digite um CEP de cliente e encontre automaticamente o **representante mais próximo**.

#### Como usar:
1. Clique no botão de chevron (◀/▶) no lado esquerdo para abrir/fechar a sidebar
2. Digite o CEP no formato: `00000-000` ou `00000000` (será formatado automaticamente)
3. Clique em "Buscar Representante"
4. O sistema irá:
   - Buscar informações de endereço do CEP (via viaCEP)
   - Obter as coordenadas geográficas do CEP
   - Calcular a distância até cada representante
   - Exibir o representante mais próximo

#### Informações exibidas:
- Nome e código do representante
- Endereço completo
- Telefone (clicável)
- Email (clicável)
- Distância em km
- Observações sobre representatividade

---

### 2. 📥 Import de Arquivo Excel

Agora você pode importar dados de representantes diretamente de um arquivo Excel (.xlsx):

#### Botão "Importar Excel":
- Localizado no header, próximo aos outros botões de ação
- Suporta arquivos `.xlsx` e `.xls`
- Processa automaticamente as colunas:
  - `codigo` ou `Código`
  - `nome` ou `Nome` 
  - `rua` ou `Rua` ou `Endereço`
  - `bairro` ou `Bairro`
  - `cidade` ou `Cidade`
  - `estado` ou `Estado` ou `UF`
  - `cep` ou `CEP`
  - `telefone` ou `Telefone` ou `Tel`
  - `email` ou `Email` ou `E-mail`
  - `observacoes` ou `Observações` ou `Obs`
  - `lat` ou `Latitude`
  - `lng` ou `Longitude` ou `Long`

#### Como usar:
1. Clique no botão "Importar Excel"
2. Selecione o arquivo Excel com os dados dos representantes
3. Os dados serão carregados e exibidos no mapa
4. Uma notificação confirmará a quantidade de representantes importados

---

### 3. 📊 Carregamento Automático (Opcional)

O arquivo `representantes dados.xlsx` pode ser colocado na pasta `public/` do projeto para ser carregado automaticamente.

#### Para usar o carregamento automático:
1. Copie o arquivo `representantes dados.xlsx` para a pasta `public/`
2. Use o hook `useLoadRepresentativesFromExcel()` em um componente
3. Os dados serão carregados quando o componente montar

#### Exemplo de uso:
```typescript
import { useLoadRepresentativesFromExcel } from '@/hooks/use-load-representatives';

function MyComponent() {
  const { data: representatives, loading, error } = useLoadRepresentativesFromExcel();
  
  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;
  
  return <p>{representatives?.length} representantes carregados</p>;
}
```

---

## 🛠️ Funções Utilitárias

### Módulo: `lib/excel-utils.ts`

#### `readExcelRepresentatives(file: File): Promise<Representative[]>`
Lê um arquivo Excel e converte para array de representantes.

#### `calculateDistance(lat1, lon1, lat2, lon2): number`
Calcula a distância em km entre dois pontos usando a fórmula Haversine.

#### `findNearestRepresentative(representatives, lat, lng): Representative | null`
Encontra o representante mais próximo de coordenadas dadas.

---

### Módulo: `lib/cep-utils.ts`

#### `getCoordenatesByCEP(cep: string): Promise<{lat, lng} | null>`
Busca as coordenadas (latitude/longitude) de um CEP.
- Usa a API viaCEP para validação
- Usa a API Open-Meteo Geocoding para obter coordenadas
- Retorna coordenadas aproximadas se necessário

#### `getAddressByCEP(cep: string): Promise<Address | null>`
Busca as informações de endereço de um CEP (rua, bairro, cidade, estado).

---

### Módulo: `lib/representatives-loader.ts`

#### `loadRepresentativesFromExcelFile(): Promise<Representative[]>`
Carrega representantes do arquivo na pasta `public/representantes dados.xlsx`.

#### `exportRepresentativesToExcel(representatives, filename?): void`
Exporta array de representantes para um arquivo Excel.

#### `filterRepresentativesByDistance(representatives, lat, lng, maxDistanceKm): Representative[]`
Filtra representantes dentro de uma distância máxima.

#### `getRepresentativesStats(representatives): Stats`
Retorna estatísticas sobre os representantes (total, por estado, etc.).

---

## 📋 Estrutura de Dados: Representative

```typescript
interface Representative {
  codigo: string;           // ID único do representante
  nome: string;             // Nome completo
  rua: string;              // Endereço da rua
  bairro: string;           // Bairro
  cidade: string;           // Cidade
  estado: string;           // Estado (UF)
  cep: string;              // CEP (formato: 00000-000)
  telefone: string;         // Telefone para contato
  email: string;            // Email para contato
  observacoes: string;      // Notas sobre áreas de cobertura, nomes de marcas, etc.
  lat?: number;             // Latitude
  lng?: number;             // Longitude
}
```

---

## 🌐 APIs Externas Utilizadas

### viaCEP (https://viacep.com.br/)
- Busca informações de endereço por CEP
- Sem chave de autenticação necessária
- Resposta em JSON

### Open-Meteo Geocoding (https://geocoding-api.open-meteo.com/)
- Converte endereço/cidade em coordenadas geográficas
- Sem chave de autenticação necessária
- Resposta em JSON

---

## 💡 Dicas de Uso

1. **Preparando o arquivo Excel:**
   - Use a primeira linha para cabeçalhos de coluna
   - Certifique-se de que as colunas de latitude/longitude têm valores numéricos
   - Se não tiver coordenadas, o sistema tentará obter via geocodificação

2. **Otimizando a busca por CEP:**
   - A primeira busca pode levar alguns segundos (API externa)
   - Buscas subsequentes são mais rápidas
   - Para melhor performance, certifique-se de ter coordenadas precisas no arquivo de representantes

3. **Troubleshooting:**
   - Se o CEP não for encontrado: Verifique se está no formato correto (8 dígitos)
   - Se não encontrar representante próximo: Verifique se os representantes têm coordenadas (lat/lng)
   - Se a importação falhar: Verif
ique o formato do arquivo Excel

---

## 📦 Dependências Adicionadas

```json
{
  "xlsx": "^0.18.5" // Para leitura/escrita de arquivos Excel
}
```

---

## 🔄 Fluxo de Uso Recomendado

1. **Upload inicial de dados:**
   - Use "Importar Excel" para carregar os dados dos representantes

2. **Busca por cliente:**
   - Abra a sidebar de busca por CEP
   - Digite o CEP do cliente
   - Visualize o representante mais próximo com distância

3. **Análise de cobertura:**
   - Use o mapa interativo para visualizar a distribuição
   - Use os filtros para ver por estado ou representante específico
   - Use a tabela de cobertura para análise detalhada

---

## ⚙️ Componentes Criados

- `CEPSearch.tsx` - Componente principal de busca por CEP
- `ExcelImport.tsx` - Componente para importar arquivos Excel
- `use-load-representatives.ts` - Hook para carregar dados automaticamente
- `lib/excel-utils.ts` - Funções para ler/processar Excel
- `lib/cep-utils.ts` - Funções para buscar informações por CEP
- `lib/representatives-loader.ts` - Funções para gerenciar dados de representantes

---

V ✅ Tudo pronto para usar!
