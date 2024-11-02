# Media Migration Script (MM)

Este script Node.js foi desenvolvido para realizar a migração de arquivos de mídia, reorganizando-os em diretórios específicos por empresa para sistemas baseados em Whaticket.

## 🎯 Objetivo

O script tem como principal objetivo reorganizar arquivos de mídia associados a mensagens, movendo-os para diretórios específicos de cada empresa, melhorando assim a organização e gestão dos arquivos no sistema.

## 🔧 Configuração

### Pré-requisitos

- Node.js
- PostgreSQL
- Módulos necessários:
  - `pg` (PostgreSQL client)
  - `fs` (File System - built-in)
  - `path` (Path manipulation - built-in)

### Configuração do Banco de Dados

O script utiliza as seguintes configurações de conexão com o PostgreSQL:

```javascript
const dbConfig = {
    user: '',
    host: 'localhost',
    database: 'whaticketdb',
    password: '',
    port: 5432
};
```

## 📋 Funcionalidades

1. **Listagem de Arquivos**
   - Lista arquivos no diretório público
   - Exibe os primeiros 5 arquivos encontrados
   - Mostra contagem total de arquivos

2. **Migração de Arquivos**
   - Busca todas as empresas com arquivos de mídia
   - Cria diretórios específicos para cada empresa
   - Move arquivos para os diretórios correspondentes
   - Mantém registro detalhado de todas as operações

3. **Logging**
   - Log detalhado com timestamp para todas as operações
   - Registro separado para erros
   - Resumo estatístico das operações

## 📊 Estatísticas e Monitoramento

O script fornece estatísticas detalhadas sobre:
- Número total de empresas processadas
- Arquivos movidos com sucesso
- Erros durante a migração
- Arquivos não encontrados
- Total de arquivos processados

## 🚀 Execução

Abre o arquivo mm.js no seu editor de prefêrencia e altere o valor de PUBLIC_FOLDER_WHATICKET 

Para executar o script:

```bash
node mm.js
```

## 📝 Logs

O script gera logs detalhados com:
- Timestamp para cada operação
- Progresso da migração
- Erros encontrados
- Estatísticas de processamento

Exemplo de log:
```
[2024-11-02T10:00:00.000Z] Iniciando processo de migração de arquivos para todas as empresas...
[2024-11-02T10:00:00.100Z] Verificando diretório público: /home/deploy/lkbkp/backend/public
```

## ⚠️ Tratamento de Erros

O script inclui:
- Tratamento de erros para operações de arquivo
- Gestão de conexões com banco de dados
- Handlers para sinais SIGTERM e SIGINT
- Encerramento gracioso de conexões

## 🔄 Processo de Migração

1. Conecta ao banco de dados
2. Lista todas as empresas com arquivos de mídia
3. Para cada empresa:
   - Cria diretório específico
   - Busca mensagens com mídia
   - Move arquivos para novo diretório
   - Registra estatísticas

## 📈 Desempenho

O script utiliza:
- Pool de conexões para o banco de dados
- Operações síncronas para garantir integridade
- Logging eficiente com timestamps

## 🛟 Suporte

Em caso de problemas:
1. Verificar logs de erro
2. Confirmar configurações do banco de dados
3. Validar permissões de diretório
4. Verificar conectividade com o banco de dados

## ⚙️ Manutenção

Recomendações:
- Fazer backup dos arquivos antes da migração
- Monitorar logs durante a execução
- Verificar espaço em disco disponível
- Manter controle de versão do script

## 🔐 Segurança

O script implementa:
- Conexão segura com o banco de dados
- Tratamento de caminhos de arquivo seguros
- Validação de existência de diretórios
- Verificação de permissões
