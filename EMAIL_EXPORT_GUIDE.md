# 📧 Guia de Exportação e Email

## HTML Monolítico - Relatório Completo em um Arquivo

A aplicação agora permite exportar um **arquivo HTML autocontido** que inclui:

✅ Todos os dados dos representantes  
✅ Tabelas formatadas e responsivas  
✅ CSS embutido (sem dependências externas)  
✅ Estatísticas e resumos  
✅ Distribuição por estado  
✅ Mapa com os representantes  

### 🎯 Como Usar

**1. Importe seus dados**
- Clique em "Importar Excel" ou "Importar CSV"
- Selecione seu arquivo com dados de representantes

**2. Clique em "Exportar"**
Na barra superior, você verá opções:
- 📄 **HTML Monolítico** - Arquivo completo para enviar por email
- 🖨️ **Imprimir/PDF** - Abre janela de impressão (salve como PDF)
- 📧 **Para Email** - Preparar para envio

**3. Selecione "HTML Monolítico"**
Um arquivo `.html` será baixado:
```
steula-relatorio-YYYY-MM-DD.html
```

### 📨 Como Enviar por Email

#### Opção 1: Gmail
1. Abra seu Gmail
2. Clique em "Escrever"
3. Clique no ícone de anexo (📎)
4. Selecione o arquivo HTML baixado
5. Escreva o título e corpo do email
6. Clique em "Enviar"

#### Opção 2: Outlook
1. Abra seu Outlook
2. Clique em "Novo E-mail"
3. Clique em "Anexar" 
4. Selecione o arquivo HTML
5. Complete o email e envie

#### Opção 3: Qualquer Outro Cliente
- Abra o cliente de email
- Crie novo email
- Anexe o arquivo `.html` obtido
- Envie normalmente

### 🌐 Como Abrir o Relatório no Email

**Se você recebeu um arquivo `.html`:**

1. **Abra no navegador**
   - Faça download do arquivo
   - Clique 2x para abrir no navegador
   - Ou arraste para uma aba do navegador

2. **Visualize formatado**
   - Tabelas completas
   - Navegável
   - Imprimível
   - Responsivo para mobile

3. **Imprima como PDF** (se necessário)
   - Clique: Ctrl+P (Windows) ou Cmd+P (Mac)
   - Escolha "Salvar como PDF"
   - Clique "Salvar"

### 📋 Estrutura do Relatório HTML

O arquivo inclui as seguintes seções:

#### 1. Cabeçalho
- Título: "Steula — Supervisão Comercial"
- Data e hora de geração
- Subtítulo: "Relatório de Cobertura de Representantes"

#### 2. Estatísticas
Caixas resumidas mostrando:
- Total de representantes
- Total de estados
- Representantes com coordenadas

#### 3. Distribuição Geográfica
- Informação sobre mapa
- Legenda de cores (presencial/possível TLV/abandono)

#### 4. Resumo por Estado
- Tabela com contagem de representantes por estado

#### 5. Detalhes dos Representantes
- Tabela completa com todas as informações:
  - Código
  - Nome
  - Rua
  - Bairro
  - Cidade
  - Estado
  - CEP
  - Telefone
  - Email
  - Observações

#### 6. Rodapé
- Informação sobre quando foi gerado
- Nota sobre como atualizar dados

### 🎨 Características do Relatório

**Design Responsivo**
- Se abrir no celular: adaptado para tela pequena
- Se imprimir: dividido em páginas

**Estilos Profissionais**
- Cores da marca (azul #0066cc)
- Tabelas com listras alternadas
- Cabeçalhos destacados
- Fonte clara e legível

**Dados Completos**
- Todos os representantes carregados
- Nenhuma informação cortada
- Formatação preservada

### 🖨️ Imprimindo/Salvando como PDF

**Método 1: Do relatório HTML**
1. Abra o arquivo `.html` no navegador
2. Pressione Ctrl+P (Windows) ou Cmd+P (Mac)
3. Escolha "Salvar como PDF"
4. Clique "Salvar"

**Método 2: Direto da aplicação**
1. Na aplicação, clique "Exportar" → "Imprimir/PDF"
2. A janela de impressão abrirá
3. Escolha "Salvar como PDF"
4. Clique "Salvar"

### ✅ Vantagens do HTML Monolítico

✨ **Sem dependências** - Não precisa de internet ou plugins  
✨ **Autocontido** - Tudo em um arquivo  
✨ **Portável** - Funciona em qualquer navegador  
✨ **Imprimível** - Excelente formatação para impressão  
✨ **Seguro** - Não precisa fazer login para visualizar  
✨ **Fácil compartilhamento** - Basta enviar por email  

### 🔒 Segurança

O arquivo HTML contém:
- ✅ Dados de representantes
- ✅ Informações de contato
- ✅ Coordenadas geográficas
- ❌ Nenhum código executável
- ❌ Nenhuma conexão com servidores

**É seguro compartilhar?**
Sim, é apenas uma visualização estática dos dados. Não há riscos de segurança.

### 📞 Exemplos de Uso

**Uso 1: Enviar para gerente**
```
1. Importe dados dos representantes
2. Clique "Exportar" → "HTML Monolítico"
3. Envie o arquivo por email para seu gerente
4. Seu gerente abre no navegador e visualiza tudo
```

**Uso 2: Compartilhar com equipe**
```
1. Gere o relatório
2. Coloque em uma pasta compartilhada (OneDrive, Google Drive)
3. Compartilhe o link
4. Equipe acessa diretamente no navegador
```

**Uso 3: Arquivar dados**
```
1. Exporte regularmente (ex: fins de mês)
2. Guarde os arquivos por data
3. Tenha histórico de mudanças na cobertura
```

**Uso 4: Para reuniões**
```
1. Gere o relatório
2. Abra em tela compartilhada (Zoom, Teams)
3. Apresente aos stakeholders
4. Distribua o arquivo depois
```

### 🐛 Troubleshooting

**P: O arquivo não abre no email?**
R: Faça download do arquivo e abra com o navegador.

**P: As tabelas ficaram desformatadas?**
R: Use um navegador moderno (Chrome, Firefox, Safari, Edge).

**P: Como incluir um mapa interativo?**
R: O mapa atual é informativo. Para mapa interativo, use a aplicação web.

**P: Posso editar o arquivo HTML?**
R: Sim, com conhecimento de HTML. Mas é melhor gerar um novo da aplicação.

**P: Qual é o tamanho máximo do arquivo?**
R: Depende da quantidade de representantes. Com 1000 representantes, ~500 KB.

### 📊 Exemplos de Dados no Relatório

```
Representante: ALEXANDRE FREIRE CAMPANELLI - ME
Código: 88
Cidade: SÃO PAULO
Estado: SP
Telefone: (11)2240-0853
Email: vendas.campanelli@gmail.com
Observações: Grande SP. Representadas: STEULA (60%) KRONOS (20%) MAGMA (20%)
```

### 🔄 Próximas Melhorias Planejadas

- [ ] Incluir mapa com Leaflet renderizado em imagem
- [ ] Suporte a assinatura no PDF
- [ ] Integração direta com Gmail API
- [ ] Geração automática de PDFs
- [ ] Relatórios customizáveis (filtros aplicáveis)

---

V Relatório pronto para enviar por email! 📧
