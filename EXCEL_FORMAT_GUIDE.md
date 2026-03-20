# 📋 Formatação do Arquivo Excel de Representantes

## Estrutura Recomendada

O arquivo `representantes dados.xlsx` deve estar formatado com as seguintes colunas:

### Colunas Obrigatórias (mínimo necessário):
- **Código** - ID único do representante (ex: 88, 98, 105)
- **Nome** - Nome da empresa representante
- **Cidade** - Cidade onde atua
- **Estado** - Estado (UF) - duas letras (SP, MG, RJ, etc.)

### Colunas Altamente Recomendadas:
- **Latitude** - Coordenada de latitude (ex: -23.5505)
- **Longitude** - Coordenada de longitude (ex: -46.6333)
- **Telefone** - Número de contato
- **Email** - Email para contato

### Colunas Adicionais:
- **Rua** - Endereço (rua, número)
- **Bairro** - Bairro
- **CEP** - CEP da sede (formato: 12345-678)
- **Observações** - Notas sobre cobertura, marcas representadas, etc.

---

## Exemplo de Dados (formato Excel)

```
| Código | Nome | Rua | Bairro | Cidade | Estado | CEP | Telefone | Email | Latitude | Longitude | Observações |
|--------|------|-----|--------|--------|--------|-----|----------|-------|----------|-----------|-------------|
| 88 | ALEXANDRE FREIRE CAMPANELLI - ME | RUA IRMA FILOMENA, 657 | JACANA | SÃO PAULO | SP | 02263-000 | (11)2240-0853 | vendas.campanelli@gmail.com | -23.5505 | -46.6333 | Grande SP. \| Representadas: STEULA (60%), KRONOS (20%), MAGMA (20%) |
| 98 | AUAD E CAMPOS LTDA | AV. OSVALDO CRUZ, 1170 | CENTRO | TRÊS PONTAS | MG | 37185-110 | (35)3265-1477 | auadcampostp@gmail.com | -21.3697 | -45.5142 | Região: Sul de MG |
| 43 | DANTAS E BRAGA REPRESENTACOES | R. CEL. AMADOR, 35 | CENTRO | MURIAÉ | MG | 36880-030 | (32)3722-4194 | dantas@dantasrep.com.br | -21.1306 | -42.3661 | MG - Zona da Mata |
```

---

## Como Preparar o Arquivo

### No Excel:
1. Crie uma nova planilha
2. Adicione cabeçalhos (primeira linha) conforme descrito acima
3. Preencha os dados dos representantes (uma linha por representante)
4. **Importante**: Use valores numéricos para Latitude e Longitude
5. Salve com o nome: `representantes dados.xlsx`

### No Google Sheets (alternativa):
1. Crie uma planilha
2. Adicione os dados conforme estrutura acima
3. Exporte como Excel (.xlsx)

### Dicas de Preenchimento:

**Coordenadas (Latitude/Longitude):**
- Sem sinal = positivo (norte/leste)
- Com sinal: + norte, - sul, + leste, - oeste
- Exemplo: SP está em -23.5505 (sul), -46.6333 (oeste)
- Para encontrar: use Google Maps (clique no mapa e copie as números)

**CEP:**
- Formato: 12345-678 (com hífen)
- Ou apenas números: 12345678 (será aceito)

**Telefone:**
- Formato: (XX)XXXX-XXXX ou qualquer formato reconhecível
- Ex: (11)2240-0853

**Email:**
- Formato padrão: usuario@dominio.com.br

**Observações:**
- Descrição das áreas de cobertura
- Marcas representadas
- Regiões específicas
- Avisos especiais

---

## Fontes de Coordenadas

Se precisar encontrar latitude e longitude:

### Opção 1: Google Maps
1. Abra Google Maps
2. Clique na localização (endereço da sede)
3. Copie os números que aparecem (lat, lng)

### Opção 2: API de Geocodificação
A própria aplicação pode buscar coordenadas automaticamente através da cidade/estado.

### Opção 3: Gerador Online
- https://www.latlong.net/ - Digite o endereço e obtenha coordenadas
- https://nominatim.org/ - Search para cidades brasileiras

---

## Variações de Nomes de Colunas Aceitas

O sistema aceita as seguintes variações automáticamente:

| Padrão Esperado | Variações Aceitas |
|---|---|
| Código | codigo, CODIGO, Cod, COD |
| Nome | nome, NOME, name, NAME |
| Rua | rua, RUA, Endereço, endereco |
| Bairro | bairro, BAIRRO |
| Cidade | cidade, CIDADE |
| Estado | estado, ESTADO, UF, uf |
| CEP | cep, CEP, Cep |
| Telefone | telefone, TELEFONE, Tel, tel |
| Email | email, EMAIL, E-mail, e-mail |
| Latitude | lat, LAT, latitude, LATITUDE |
| Longitude | lng, LNG, longitude, LONGITUDE, long, Long |
| Observações | observacoes, OBSERVACOES, Obs, obs, Observações |

---

## Validação de Dados

### Antes de importar, verifique:
- ✅ Todas as linhas têm Código, Nome, Cidade e Estado
- ✅ Coordenadas (lat/lng) são números válidos
- ✅ Não há linhas vazias no meio da tabela
- ✅ Email está no formato correto (se preenchido)
- ✅ Não há caracteres especiais quebrados

---

## Exemplo Completo de Arquivo Mínimo

Se você só tiver informações básicas, o mínimo necessário é:

```
| Código | Nome | Cidade | Estado | Latitude | Longitude |
|--------|------|--------|--------|----------|-----------|
| 88 | ALEXANDRE FREIRE | SÃO PAULO | SP | -23.5505 | -46.6333 |
| 98 | AUAD E CAMPOS | TRÊS PONTAS | MG | -21.3697 | -45.5142 |
```

O resto pode ser preenchido depois através da interface da aplicação.

---

## Próximas Etapas

1. Salve o arquivo como `representantes dados.xlsx`
2. Abra a aplicação Steula
3. Clique em "Importar Excel"
4. Selecione o arquivo
5. Pronto! Os dados serão carregados

---

## ⚙️ Se o arquivo for muito grande

Se tiver muitos representantes (> 1000):
- Certifique-se que não há colunas vazias
- Remova linhas duplicadas
- Salve sem formatações especiais complexas
- Se a importação ficar lenta, pode ser necessário otimizar

---

V Seu arquivo está pronto para ser importado!
