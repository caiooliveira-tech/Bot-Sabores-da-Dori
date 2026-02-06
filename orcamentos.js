const fs = require('fs').promises;
const path = require('path');

const ORCAMENTOS_FILE = path.join(__dirname, 'orcamentos.json');

/**
 * Inicializa o arquivo de orçamentos se não existir
 */
async function initOrcamentosFile() {
    try {
        await fs.access(ORCAMENTOS_FILE);
    } catch {
        await fs.writeFile(ORCAMENTOS_FILE, JSON.stringify([], null, 2));
        console.log(`[${new Date().toISOString()}] Arquivo de orçamentos criado`);
    }
}

/**
 * Carrega orçamentos do arquivo
 * @returns {Promise<Array>} Lista de orçamentos
 */
async function loadOrcamentos() {
    try {
        const data = await fs.readFile(ORCAMENTOS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao carregar orçamentos:`, error.message);
        return [];
    }
}

/**
 * Salva orçamentos no arquivo
 * @param {Array} orcamentos - Lista de orçamentos
 */
async function saveOrcamentos(orcamentos) {
    try {
        await fs.writeFile(ORCAMENTOS_FILE, JSON.stringify(orcamentos, null, 2));
        console.log(`[${new Date().toISOString()}] Orçamentos salvos com sucesso`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao salvar orçamentos:`, error.message);
        throw error;
    }
}

/**
 * Adiciona novo orçamento
 * @param {string} numero - Número do cliente
 * @param {string} mensagem - Mensagem do orçamento
 * @param {boolean} temImagem - Se contém imagem
 * @returns {Promise<Object>} Orçamento criado
 */
async function adicionarOrcamento(numero, mensagem, temImagem = false) {
    try {
        const orcamentos = await loadOrcamentos();

        const novoOrcamento = {
            id: Date.now(),
            numero: numero,
            mensagem: mensagem,
            timestamp: new Date().toISOString(),
            status: 'novo',
            temImagem: temImagem
        };

        orcamentos.push(novoOrcamento);
        await saveOrcamentos(orcamentos);

        console.log(`[${new Date().toISOString()}] Novo orçamento adicionado - ID: ${novoOrcamento.id}`);
        console.log(`[${new Date().toISOString()}] Cliente: ${numero}`);
        console.log(`[${new Date().toISOString()}] Mensagem: ${mensagem.substring(0, 100)}...`);

        return novoOrcamento;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao adicionar orçamento:`, error.message);
        throw error;
    }
}

/**
 * Lista todos os orçamentos
 * @param {string} status - Filtrar por status (opcional)
 * @returns {Promise<Array>} Lista de orçamentos
 */
async function listarOrcamentos(status = null) {
    try {
        const orcamentos = await loadOrcamentos();

        if (status) {
            return orcamentos.filter(orc => orc.status === status);
        }

        return orcamentos;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao listar orçamentos:`, error.message);
        return [];
    }
}

/**
 * Atualiza status de um orçamento
 * @param {number} id - ID do orçamento
 * @param {string} novoStatus - Novo status
 * @returns {Promise<boolean>} Sucesso da operação
 */
async function atualizarStatusOrcamento(id, novoStatus) {
    try {
        const orcamentos = await loadOrcamentos();
        const index = orcamentos.findIndex(orc => orc.id === id);

        if (index === -1) {
            console.error(`[${new Date().toISOString()}] Orçamento ${id} não encontrado`);
            return false;
        }

        orcamentos[index].status = novoStatus;
        orcamentos[index].updatedAt = new Date().toISOString();

        await saveOrcamentos(orcamentos);
        console.log(`[${new Date().toISOString()}] Orçamento ${id} atualizado para status: ${novoStatus}`);

        return true;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao atualizar orçamento:`, error.message);
        return false;
    }
}

/**
 * Obtém estatísticas dos orçamentos
 * @returns {Promise<Object>} Estatísticas
 */
async function getEstatisticas() {
    try {
        const orcamentos = await loadOrcamentos();

        return {
            total: orcamentos.length,
            novos: orcamentos.filter(o => o.status === 'novo').length,
            emAndamento: orcamentos.filter(o => o.status === 'em_andamento').length,
            concluidos: orcamentos.filter(o => o.status === 'concluido').length,
            comImagem: orcamentos.filter(o => o.temImagem).length
        };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao obter estatísticas:`, error.message);
        return null;
    }
}

module.exports = {
    initOrcamentosFile,
    adicionarOrcamento,
    listarOrcamentos,
    atualizarStatusOrcamento,
    getEstatisticas
};
