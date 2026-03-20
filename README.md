# Steula — Supervisão Comercial 🗺️

Uma aplicação web moderna para gerenciar cobertura de representantes comerciais com busca inteligente por CEP.

## 🎯 Funcionalidades Principais

### 📍 Busca Inteligente por CEP
- Digite um CEP do cliente e encontre automaticamente o **representante mais próximo**
- Cálculo de distância em tempo real usando coordenadas geográficas
- Interface amigável com exibição de informações de contato

### 📥 Importação de Excel
- Importe dados de representantes diretamente de arquivos Excel
- Suporte automático para variações de nomes de coluna
- Validação e processamento inteligente de dados

### 🗺️ Visualização em Mapa
- Mapa interativo mostrando localização de todos os representantes
- Codificação por cores para zonas de atendimento:
  - 🟢 **Presencial**: ≤ 150 km
  - 🟡 **Atendimento Possível TLV**: 151–300 km
  - 🔴 **Abandono**: > 300 km

### 📊 Análise de Cobertura
- Tabela detalhada com informações de cobertura
- Filtros por estado e representante
- Exportação de relatórios em CSV
- Estatísticas gerais de cobertura

---

## 🚀 Início Rápido

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

---

## 📋 Como Usar

### 1. Importar Dados de Representantes

```bash
# Opção 1: Interface Web
- Clique em "Importar Excel" no topo
- Selecione seu arquivo Excel com dados dos representantes
- Os dados serão carregados automaticamente
```

O arquivo Excel deve conter:
- **Obrigatório**: Código, Nome, Cidade, Estado
- **Recomendado**: Latitude, Longitude, Telefone, Email
- **Opcional**: Rua, Bairro, CEP, Observações

Veja [EXCEL_FORMAT_GUIDE.md](./EXCEL_FORMAT_GUIDE.md) para formato completo.

### 2. Buscar Representante por CEP

```
1. Clique no botão ◀ para abrir a sidebar
2. Digite um CEP (ex: 01310-100)
3. Clique em "Buscar Representante"
4. Veja o representante mais próximo e a distância
```

### 3. Analisar Cobertura

```
- Visualize geograficamente os representantes no mapa
- Use filtros para análise por estado/representante
- Consulte a tabela de cobertura para detalhes
- Exporte relatórios em CSV
```

---

## 🛠️ Arquitetura Técnica

### Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query (TanStack Query)
- **Maps**: Leaflet
- **Routing**: React Router
- **Build**: Vite
- **Excel**: XLSX
- **Testing**: Vitest + Playwright

### Estrutura de Pastas
```
src/
├── components/           # Componentes React
│   ├── CEPSearch.tsx    # 🆕 Busca por CEP
│   ├── ExcelImport.tsx  # 🆕 Importação Excel
│   ├── CoverageMap.tsx
│   ├── CoverageTable.tsx
│   └── ui/              # Componentes shadcn
├── lib/                 # Funções utilitárias
│   ├── excel-utils.ts   # 🆕 Processamento de Excel
│   ├── cep-utils.ts     # 🆕 Busca por CEP
│   ├── representatives-loader.ts # 🆕
│   └── geo-utils.ts
├── hooks/               # Custom hooks
│   └── use-load-representatives.ts # 🆕
├── pages/               # Páginas
│   └── Index.tsx        # Página principal (modificada)
├── types/               # Tipos TypeScript
│   └── representative.ts
├── data/                # Dados de exemplo
│   └── sample-data.ts
└── styles/             # Estilos globais
```

---

## 📦 Dependências Principais

```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  "leaflet": "^1.9.4",
  "recharts": "^2.15.4",
  "tailwindcss": "^3.4.17",
  "xlsx": "^0.18.5",
  "zod": "^3.25.76"
}
```

---

## 🌐 APIs Externas

### viaCEP
- Busca informações de endereço por CEP
- URL: `https://viacep.com.br/ws/{CEP}/json/`
- Sem autenticação necessária

### Open-Meteo Geocoding
- Converte endereço em coordenadas geográficas
- URL: `https://geocoding-api.open-meteo.com/v1/search`
- Sem autenticação necessária

---

## 📖 Documentação Adicional

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Guia rápido de configuração
- **[CEP_SEARCH_GUIDE.md](./CEP_SEARCH_GUIDE.md)** - Documentação detalhada de funcionalidades
- **[EXCEL_FORMAT_GUIDE.md](./EXCEL_FORMAT_GUIDE.md)** - Formato do arquivo Excel esperado

---

## 🔑 Tipos Principais

### Representative
```typescript
interface Representative {
  codigo: string;        // ID único
  nome: string;         // Nome da empresa
  rua: string;          // Endereço
  bairro: string;       // Bairro
  cidade: string;       // Cidade
  estado: string;       // Estado (UF)
  cep: string;          // CEP
  telefone: string;     // Telefone
  email: string;        // Email
  observacoes: string;  // Notas
  lat?: number;         // Latitude
  lng?: number;         // Longitude
}
```

### CoverageZone
```typescript
type CoverageZone = 'presencial' | 'possivel_tlv' | 'abandono';

interface CoverageData {
  representante: string;
  cidade: string;
  estado: string;
  distanciaKm: number;
  zona: CoverageZone;
}
```

---

## 🎨 Componentes Criados/Modificados

### Novos ✨
- **CEPSearch.tsx** - Barra lateral de busca por CEP inteligente
- **ExcelImport.tsx** - Importador flexível de arquivos Excel
- **excel-utils.ts** - Utilitários para processamento de Excel
- **cep-utils.ts** - Busca de coordenadas por CEP
- **representatives-loader.ts** - Gerenciamento de dados
- **use-load-representatives.ts** - Hook para carregamento automático

### Modificados 🔄
- **Index.tsx** - Integração da sidebar e novo botão de import

---

## 💡 Exemplos de Uso

### Buscar representante mais próximo programaticamente
```typescript
import { findNearestRepresentative, calculateDistance } from '@/lib/excel-utils';
import { getCoordenatesByCEP } from '@/lib/cep-utils';

const coords = await getCoordenatesByCEP('01310-100');
const nearest = findNearestRepresentative(representatives, coords.lat, coords.lng);
console.log(`Representante mais próximo: ${nearest?.nome}`);
```

### Carregar dados automaticamente
```typescript
import { useLoadRepresentativesFromExcel } from '@/hooks/use-load-representatives';

function MyComponent() {
  const { data: representatives, loading, error } = useLoadRepresentativesFromExcel();
  return representatives && <p>{representatives.length} representantes</p>;
}
```

### Exportar dados para Excel
```typescript
import { exportRepresentativesToExcel } from '@/lib/representatives-loader';

exportRepresentativesToExcel(representatives, 'representantes.xlsx');
```

---

## ⚠️ Notas Importantes

1. **Coordenadas essenciais**: Para busca por CEP funcionar, representantes devem ter Latitude/Longitude
2. **APIs devem estar acessíveis**: A aplicação precisa de conexão com viaCEP e Open-Meteo
3. **Primeiro carregamento**: A primeira requisição pode levar alguns segundos
4. **Limites de API**: APIs gratuitas podem ter limitações de requisições

---

## 🔐 Performance & Segurança

- Dados processados localmente (sem envio para servidores)
- APIs externas usadas apenas para geocodificação
- Cálculos de distância em tempo real no navegador
- Otimizações de rendering com React Query

---

## 📱 Responsividade

A aplicação é totalmente responsiva:
- Desktop: Layout completo com sidebar
- Tablet: Sidebar recolhível
- Mobile: Interface touch-friendly

---

## 🧪 Testes

```bash
# Executar testes
npm run test

# Modo watch
npm run test:watch

# Testes E2E (Playwright)
npm run test:e2e
```

---

## 🤝 Contribuição

Melhorias e sugestões são bem-vindas!

---

## 📄 Licença

Este projeto é parte do sistema Steula de Supervisão Comercial.

---

## 📞 Suporte

Para dúvidas sobre:
- **Importação de Excel**: Veja [EXCEL_FORMAT_GUIDE.md](./EXCEL_FORMAT_GUIDE.md)
- **Busca por CEP**: Veja [CEP_SEARCH_GUIDE.md](./CEP_SEARCH_GUIDE.md)
- **Configuração**: Veja [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**Versão**: 0.0.1  
**Última Atualização**: Março 2026  
**Status**: ✅ Pronto para Produção
