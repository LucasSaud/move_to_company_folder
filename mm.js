const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuração da conexão com o banco de dados
const dbConfig = {
    user: 'likezap',
    host: 'localhost',
    database: 'likezap',
    password: 'likezap',
    port: 5432,
};

// Função para log com timestamp
function logWithTime(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// Função para log de erro com timestamp
function logErrorWithTime(message, error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
    if (error) {
        console.error(`Detalhes do erro:`, error);
    }
}

// Criando pool de conexões
const pool = new Pool(dbConfig);

// Função para listar arquivos em um diretório
function listFiles(dir) {
    logWithTime(`Listando arquivos em: ${dir}`);
    try {
        const files = fs.readdirSync(dir);
        logWithTime(`Encontrados ${files.length} arquivos/pastas`);
        files.slice(0, 5).forEach(file => {
            logWithTime(`  → ${file}`);
        });
        if (files.length > 5) {
            logWithTime(`  → ... e mais ${files.length - 5} arquivos`);
        }
        return files;
    } catch (error) {
        logErrorWithTime(`Erro ao listar diretório ${dir}`, error);
        return [];
    }
}

async function moveFilesForCompany(client, companyId, publicDir) {
    try {
        logWithTime(`\n=== Iniciando processamento da empresa ${companyId} ===`);
        
        const companyDir = path.join(publicDir, `company${companyId}`);
        logWithTime(`Verificando diretório da empresa: ${companyDir}`);
        
        if (!fs.existsSync(companyDir)) {
            logWithTime(`Criando diretório para empresa: ${companyDir}`);
            fs.mkdirSync(companyDir, { recursive: true });
            logWithTime('✓ Diretório da empresa criado com sucesso');
        }

        // Query para buscar todas as mensagens com mídia da empresa
        const mediaQuery = `
            SELECT id, "mediaUrl", "companyId"
            FROM "Messages"
            WHERE "companyId" = $1 AND "mediaUrl" IS NOT NULL;
        `;

        const mediaResults = await client.query(mediaQuery, [companyId]);
        logWithTime(`Encontradas ${mediaResults.rows.length} mensagens com mídia`);
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const row of mediaResults.rows) {
            const mediaUrl = row.mediaUrl;
            const messageId = row.id;
            
            // Remover URL base e prefixo de company se existirem
            const mediaPath = mediaUrl.replace(/^.*\/public\//, '').replace(/company\d+\//, '');
            const currentPath = path.join(publicDir, mediaPath);
            const newPath = path.join(companyDir, path.basename(mediaPath));

            logWithTime(`Processando arquivo da mensagem ${messageId}:`);
            logWithTime(`  → De: ${currentPath}`);
            logWithTime(`  → Para: ${newPath}`);

            if (fs.existsSync(currentPath)) {
                try {
                    const targetDir = path.dirname(newPath);
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }

                    fs.renameSync(currentPath, newPath);
                    logWithTime(`  ✓ Arquivo movido com sucesso`);
                    successCount++;
                } catch (error) {
                    logErrorWithTime(`  ✗ Erro ao mover arquivo`, error);
                    errorCount++;
                }
            } else {
                logWithTime(`  ↷ Arquivo não encontrado no caminho de origem: ${currentPath}`);
                skippedCount++;
            }
        }

        logWithTime(`\nResumo da operação para empresa ${companyId}:`);
        logWithTime(`✓ Arquivos movidos com sucesso: ${successCount}`);
        logWithTime(`✗ Erros ao mover: ${errorCount}`);
        logWithTime(`↷ Arquivos não encontrados: ${skippedCount}`);
        logWithTime(`Total processado: ${mediaResults.rows.length}`);
        
        return { successCount, errorCount, skippedCount, total: mediaResults.rows.length };
    } catch (error) {
        logErrorWithTime(`Erro ao processar empresa ${companyId}`, error);
        throw error;
    }
}

async function moveFilesForAllCompanies() {
    const client = await pool.connect();
    try {
        const publicDir = `/home/deploy/lkbkp/backend/public`;
        logWithTime(`Verificando diretório público: ${publicDir}`);
        
        // Listar arquivos no diretório público
        listFiles(publicDir);

        // Query para buscar todas as empresas que têm arquivos de mídia
        logWithTime('\nBuscando todas as empresas com arquivos de mídia...');
        const companiesQuery = `
            SELECT "companyId", COUNT("mediaUrl") as media_count
            FROM "Messages"
            WHERE "mediaUrl" IS NOT NULL AND "companyId" IS NOT NULL
            GROUP BY "companyId"
            ORDER BY media_count ASC;
        `;

        const companiesResult = await client.query(companiesQuery);
        const totalCompanies = companiesResult.rows.length;
        logWithTime(`Encontradas ${totalCompanies} empresas com arquivos de mídia`);

        let totalStats = {
            successCount: 0,
            errorCount: 0,
            skippedCount: 0,
            totalProcessed: 0
        };

        for (let i = 0; i < companiesResult.rows.length; i++) {
            const company = companiesResult.rows[i];
            const companyId = company.companyId;
            const mediaCount = parseInt(company.media_count);
            
            logWithTime(`\nProcessando empresa ${i + 1} de ${totalCompanies}`);
            logWithTime(`Empresa ID ${companyId} (${mediaCount} arquivos de mídia)`);

            const stats = await moveFilesForCompany(client, companyId, publicDir);
            
            totalStats.successCount += stats.successCount;
            totalStats.errorCount += stats.errorCount;
            totalStats.skippedCount += stats.skippedCount;
            totalStats.totalProcessed += stats.total;
        }

        logWithTime('\n=== Resumo final de todas as empresas ===');
        logWithTime(`Total de empresas processadas: ${totalCompanies}`);
        logWithTime(`Total de arquivos movidos com sucesso: ${totalStats.successCount}`);
        logWithTime(`Total de erros ao mover: ${totalStats.errorCount}`);
        logWithTime(`Total de arquivos não encontrados: ${totalStats.skippedCount}`);
        logWithTime(`Total de arquivos processados: ${totalStats.totalProcessed}`);

    } catch (error) {
        logErrorWithTime('Erro ao processar empresas', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    let poolEnded = false;
    try {
        logWithTime('Iniciando processo de migração de arquivos para todas as empresas...');
        await moveFilesForAllCompanies();
        logWithTime('Processo de migração concluído!');
    } catch (error) {
        logErrorWithTime('Erro fatal durante a execução', error);
    } finally {
        try {
            logWithTime('Encerrando conexões com o banco de dados...');
            await pool.end();
            poolEnded = true;
            logWithTime('✓ Conexões com o banco de dados encerradas com sucesso');
        } catch (error) {
            logErrorWithTime('Erro ao encerrar conexões com o banco', error);
        } finally {
            // Força o encerramento do script após 1 segundo
            setTimeout(() => {
                if (!poolEnded) {
                    logWithTime('Forçando encerramento do script...');
                }
                process.exit(0);
            }, 1000);
        }
    }
}

// Adiciona handlers para sinais de término
process.on('SIGTERM', () => {
    logWithTime('Recebido sinal SIGTERM - Encerrando...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logWithTime('Recebido sinal SIGINT - Encerrando...');
    process.exit(0);
});

// Executar o script
main();