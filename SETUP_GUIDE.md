# ⚡ Guia Rápido de Configuração - Busca por CEP

## O que foi implementado

### ✅ Barra Lateral de Busca por CEP
- Digite um CEP e encontre automaticamente o representante mais próximo
- Mostra distância em km, telefone, email e endereço completo
- Usa APIs gratuitas para geocodificação

### ✅ Import de Arquivo Excel
- Novo botão "Importar Excel" no header
- Suporta arquivos `.xlsx` com dados dos representantes
- Mapeia automaticamente diferentes nomes de coluna (Código/codigo, Nome/nome, etc.)

### ✅ Cálculo de Distância
- Usa a fórmula Haversine para calcular distância precisa entre coordenadas
- Encontra o representante mais próximo para qualquer CEP

---

## Como Usar

### 1️⃣ Para buscar representante por CEP:
1. Abra a aplicação
2. Clique no botão ◀ para abrir a barra lateral
3. Digite um CEP (example: 01310-100 para São Paulo)
4. Clique em "Buscar Representante"
5. Veja o representante mais próximo com distância em km

### 2️⃣ Para importar dados de representantes:
1. Clique no botão "Importar Excel" no topo
2. Selecione o arquivo Excel com os dados
3. Os dados serão carregados e exibidos no mapa

---

## Estrutura do Arquivo Excel Esperado

O arquivo deve ter uma coluna com:

| Coluna | Tipo | Exemplo | Obrigatório |
|--------|------|---------|------------|
| Código | Texto | 88 | ✅ |
| Nome | Texto | ALEXANDRE FREIRE | ✅ |
| Rua | Texto | RUA IRMA FILOMENA, 657 | ✅ |
| Bairro | Texto | JACANA | ✅ |
| Cidade | Texto | SÃO PAULO | ✅ |
| Estado | Texto | SP | ✅ |
| CEP | Texto | 02263-000 | ⚠️ Recomendado |
| Telefone | Texto | (11)2240-0853 | ⚠️ Recomendado |
| Email | Texto | vendas@gmail.com | ⚠️ Recomendado |
| Latitude | Número | -23.5505 | ✅ Para busca por CEP |
| Longitude | Número | -46.6333 | ✅ Para busca por CEP |
| Observações | Texto | Áreas de atuação | Opcional |

---

## 🔧 Arquivos Modificados/Criados

### Novos Componentes:
- `src/components/CEPSearch.tsx` - Barra lateral de busca por CEP
- `src/components/ExcelImport.tsx` - Importador de arquivos Excel

### Novos Módulos Utilitários:
- `src/lib/excel-utils.ts` - Funções para ler/processar Excel
- `src/lib/cep-utils.ts` - Funções para buscar informações por CEP
- `src/lib/representatives-loader.ts` - Gerenciamento de dados de representantes

### Novos Hooks:
- `src/hooks/use-load-representatives.ts` - Hook para carregar dados automaticamente

### Páginas Modificadas:
- `src/pages/Index.tsx` - Integração da sidebar e do novo botão de import

---

## 🌍 APIs Utilizadas

### viaCEP
- Busca endereço por CEP
- URL: `https://viacep.com.br/ws/{CEP}/json/`
- Sem autenticação necessária

### Open-Meteo Geocoding
- Converte endereço em coordenadas geográficas
- URL: `https://geocoding-api.open-meteo.com/v1/search`
- Sem autenticação necessária

---

## 📦 Dependências Instaladas

```
xlsx - Para leitura e escrita de arquivos Excel
```

---

## 🚀 Como Iniciar o Projeto

```bash
# Dev
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 💡 Exemplos de CEPs para Testar

- **01310-100** - São Paulo, SP
- **30130-100** - Belo Horizonte, MG
- **20040020** - Rio de Janeiro, RJ
- **70040942** - Brasília, DF
- **60165095** - Fortaleza, CE

---

## ⚠️ Notas Importantes

1. **Coordenadas são essenciais**: Para que a busca por CEP funcione, os representantes no arquivo Excel devem ter valores em Latitude (lat) e Longitude (lng).

2. **Primeira busca pode ser lenta**: A primeira requisição às APIs externas pode levar alguns segundos.

3. **Limite de requisições**: As APIs têm limites de requisições gratuitas. Para produção, considere usar uma solução com chave de API.

4. **Offline**: A busca por CEP requer conexão com internet para funcionar.

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| CEP não encontrado | Verifique se está no formato correto (8 dígitos) |
| Sem representante próximo | Verifique se os representantes têm coordenadas (lat/lng) |
| Importação falha | Valide o formato do arquivo Excel |
| Sidebar não abre | Clique no botão ◀ no lado esquerdo |

---

V Pronto para usar! 🎉
