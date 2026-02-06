require('dotenv').config();
const express = require('express');
const EvolutionAPIClient = require('./evolutionAPI');
const { processMessage } = require('./flows');
const { initOrcamentosFile, adicionarOrcamento } = require('./orcamentos');

const app = express();
app.use(express.json());

// Validar variáveis de ambiente
const requiredEnvVars = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'INSTANCE_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`[${new Date().toISOString()}] ❌ Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    console.error(`[${new Date().toISOString()}] Configure o arquivo .env antes de iniciar o servidor`);
    process.exit(1);
}

// Inicializar cliente da Evolution API
let evolutionClient;
try {
    evolutionClient = new EvolutionAPIClient();
    console.log(`[${new Date().toISOString()}] ✅ Cliente Evolution API inicializado`);
} catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Erro ao inicializar Evolution API:`, error.message);
    process.exit(1);
}

// Inicializar arquivo de orçamentos
initOrcamentosFile().then(() => {
    console.log(`[${new Date().toISOString()}] ✅ Sistema de orçamentos inicializado`);
});

/**
 * Endpoint principal do webhook - recebe mensagens da Evolution API
 */
app.post('/webhook', async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] 📨 Webhook recebido`);

        // Responder imediatamente para não bloquear a Evolution API
        res.status(200).json({ success: true });

        const event = req.body;

        // Log do evento completo (útil para debug)
        console.log(`[${new Date().toISOString()}] Evento:`, JSON.stringify(event, null, 2));

        // Extrair dados da mensagem
        const messageData = event.data;
        if (!messageData) {
            console.log(`[${new Date().toISOString()}] ⚠️ Evento sem dados de mensagem`);
            return;
        }

        const key = messageData.key;
        const message = messageData.message;

        if (!key || !message) {
            console.log(`[${new Date().toISOString()}] ⚠️ Estrutura de mensagem inválida`);
            return;
        }

        // Ignorar mensagens enviadas pelo próprio bot
        // if (key.fromMe) {
        //     console.log(`[${new Date().toISOString()}] ⏭️ Ignorando mensagem própria`);
        //     return;
        // }

        // Extrair número do remetente
        const remoteJid = key.remoteJid;
        if (!remoteJid) {
            console.log(`[${new Date().toISOString()}] ⚠️ RemoteJid não encontrado`);
            return;
        }

        // Extrair texto da mensagem
        let messageText = '';
        let hasImage = false;

        if (message.conversation) {
            messageText = message.conversation;
        } else if (message.extendedTextMessage) {
            messageText = message.extendedTextMessage.text;
        } else if (message.imageMessage) {
            messageText = message.imageMessage.caption || '[Imagem enviada]';
            hasImage = true;
        } else {
            console.log(`[${new Date().toISOString()}] ⚠️ Tipo de mensagem não suportado`);
            return;
        }

        console.log(`[${new Date().toISOString()}] 💬 Mensagem de ${remoteJid}: "${messageText}"`);

        // Processar mensagem através dos fluxos
        const { response, shouldSaveOrcamento } = processMessage(remoteJid, messageText, hasImage);

        // Salvar orçamento se necessário
        if (shouldSaveOrcamento) {
            try {
                await adicionarOrcamento(remoteJid, messageText, hasImage);
                console.log(`[${new Date().toISOString()}] 💾 Orçamento salvo`);
            } catch (error) {
                console.error(`[${new Date().toISOString()}] ❌ Erro ao salvar orçamento:`, error.message);
            }
        }

        // Enviar resposta
        try {
            await evolutionClient.sendTextMessage(remoteJid, response);
            console.log(`[${new Date().toISOString()}] ✅ Resposta enviada`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Erro ao enviar resposta:`, error.message);

            // Tentar enviar mensagem de erro genérica
            try {
                await evolutionClient.sendTextMessage(
                    remoteJid,
                    'Desculpe, ocorreu um erro temporário. Por favor, tente novamente em alguns instantes.'
                );
            } catch (retryError) {
                console.error(`[${new Date().toISOString()}] ❌ Erro ao enviar mensagem de erro:`, retryError.message);
            }
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Erro no processamento do webhook:`, error.message);
        console.error(error.stack);
    }
});

/**
 * Health check endpoint
 */

app.post('/', async (req, res) => {
    // Reutiliza a mesma lógica do /webhook
    req.url = '/webhook';
    app.handle(req, res);
});

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'WhatsApp Bot - Sabores da Dori',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});

/**
 * Endpoint para verificar status da instância Evolution API
 */
app.get('/status', async (req, res) => {
    try {
        const status = await evolutionClient.getInstanceStatus();
        res.json({
            success: true,
            instance: process.env.INSTANCE_NAME,
            status: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint para configurar webhook (útil para setup inicial)
 */
app.post('/configure-webhook', async (req, res) => {
    try {
        const webhookUrl = process.env.WEBHOOK_URL || req.body.webhookUrl;

        if (!webhookUrl) {
            return res.status(400).json({
                success: false,
                error: 'WEBHOOK_URL não configurado'
            });
        }

        const result = await evolutionClient.configureWebhook(webhookUrl);

        res.json({
            success: true,
            message: 'Webhook configurado com sucesso',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${new Date().toISOString()}] 🚀 Servidor iniciado com sucesso!`);
    console.log(`[${new Date().toISOString()}] 🌐 Porta: ${PORT}`);
    console.log(`[${new Date().toISOString()}] 📱 Instância: ${process.env.INSTANCE_NAME}`);
    console.log(`[${new Date().toISOString()}] 🔗 Evolution API: ${process.env.EVOLUTION_API_URL}`);
    console.log(`${'='.repeat(60)}\n`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] ❌ Unhandled Rejection:`, reason);
});

process.on('uncaughtException', (error) => {
    console.error(`[${new Date().toISOString()}] ❌ Uncaught Exception:`, error);
    process.exit(1);
});
