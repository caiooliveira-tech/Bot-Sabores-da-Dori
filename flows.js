/**
 * Sistema de fluxos de conversa para o bot de confeitaria
 */

// Estado da conversa por usuário (em produção, usar Redis ou banco de dados)
const userStates = new Map();

/**
 * Define o estado do usuário
 */
function setUserState(number, state) {
    userStates.set(number, {
        state: state,
        timestamp: Date.now()
    });
}

/**
 * Obtém o estado do usuário
 */
function getUserState(number) {
    const data = userStates.get(number);
    if (!data) return null;

    // Limpar estado após 30 minutos de inatividade
    if (Date.now() - data.timestamp > 30 * 60 * 1000) {
        userStates.delete(number);
        return null;
    }

    return data.state;
}

/**
 * Mensagens dos fluxos de conversa
 */
const FLOWS = {
    MENU_INICIAL: `Olá! 👋 Bem-vindo à *Sabores da Dori*!

Como posso te ajudar hoje?

1️⃣ Ver catálogo
2️⃣ Fazer orçamento  
3️⃣ Falar com atendente
4️⃣ Ver depoimentos

Digite o número da opção desejada.`,

    CATALOGO: `📋 *Nosso Catálogo:*

🎂 *BOLOS DECORADOS*
- Chocolate com ganache (R$ 80 - 1kg)
- Cenoura com brigadeiro (R$ 70 - 1kg)
- Red Velvet (R$ 120 - 1kg)
- Mesclado (R$ 90 - 1kg)

🧁 *DOCES FINOS* (mínimo 50 unidades)
- Brigadeiro gourmet (R$ 3,50/un)
- Beijinho de coco (R$ 3,50/un)
- Cajuzinho (R$ 3,50/un)
- Brownie bite (R$ 5/un)

🍰 *TORTAS*
- Torta de limão (R$ 95)
- Torta de morango (R$ 115)
- Torta holandesa (R$ 105)

🎉 *KITS FESTAS*
- Kit 50 pessoas (R$ 350)
- Kit 100 pessoas (R$ 650)

📸 Quer ver fotos? Digite *fotos*
💰 Fazer orçamento? Digite *2*
🏠 Menu principal? Digite *0*`,

    ORCAMENTO: `💰 *Orçamento Personalizado*

Para fazer seu orçamento, preciso saber:

📝 *Formato sugerido:*
------------------
Produto: (bolo/doces/torta/kit)
Sabor: 
Quantidade: (kg ou unidades)
Data do evento: 
Entrega: (retirada ou endereço)
------------------

Você também pode me enviar uma *foto de referência* se tiver!

Após enviar, preparo seu orçamento em até 2 horas. ⏰`,

    ATENDENTE: `👤 *Atendimento Humano*

Vou te conectar com nossa equipe! 

Horário de atendimento:
🕐 Segunda a Sexta: 9h às 18h
🕐 Sábado: 9h às 13h

Fora desse horário, deixe sua mensagem que retornamos assim que possível! 📱`,

    DEPOIMENTOS: `⭐ *O que dizem nossos clientes:*

"Bolo de chocolate perfeito! Todos adoraram!" - Maria S.

"Doces finos lindos e deliciosos!" - João P.

"Entrega pontual e bolo como pedi!" - Ana L.

⭐⭐⭐⭐⭐ Nota: 4.9/5.0

Digite *1* para catálogo
Digite *2* para orçamento`,

    FOTOS: `📸 *Galeria de Produtos*

📱 Instagram: @docesdamamae
📘 Facebook: /docesdamamae

Ou digite *3* para pedir fotos específicas!

Menu? Digite *0*`,

    NAO_ENTENDI: `Desculpe, não entendi 😅

Digite *menu* para ver as opções!
Ou *3* para falar com atendente.`
};

/**
 * Gatilhos para cada fluxo
 */
const TRIGGERS = {
    MENU_INICIAL: ['oi', 'olá', 'ola', 'menu', 'começar', 'comecar', 'inicio', 'início', '0'],
    CATALOGO: ['1', 'catalogo', 'catálogo', 'produtos', 'cardapio', 'cardápio'],
    ORCAMENTO: ['2', 'orçamento', 'orcamento', 'preço', 'preco', 'quanto custa', 'valor'],
    ATENDENTE: ['3', 'atendente', 'humano', 'falar', 'pessoa'],
    DEPOIMENTOS: ['4', 'depoimentos', 'avaliacoes', 'avaliações', 'reviews'],
    FOTOS: ['fotos', 'imagens', 'ver fotos', 'galeria', 'instagram', 'insta']
};

/**
 * Processa mensagem e retorna resposta apropriada
 * @param {string} number - Número do remetente
 * @param {string} message - Mensagem recebida
 * @param {boolean} hasImage - Se a mensagem contém imagem
 * @returns {Object} { response: string, shouldSaveOrcamento: boolean }
 */
function processMessage(number, message, hasImage = false) {
    const normalizedMessage = message.toLowerCase().trim();
    const currentState = getUserState(number);

    console.log(`[${new Date().toISOString()}] Processando mensagem de ${number}: "${message}" (Estado: ${currentState})`);

    // Verificar gatilhos do menu inicial
    if (TRIGGERS.MENU_INICIAL.some(trigger => normalizedMessage === trigger || normalizedMessage.includes(trigger))) {
        setUserState(number, null);
        return { response: FLOWS.MENU_INICIAL, shouldSaveOrcamento: false };
    }

    // Verificar gatilhos do catálogo
    if (TRIGGERS.CATALOGO.some(trigger => normalizedMessage === trigger || normalizedMessage.includes(trigger))) {
        setUserState(number, 'CATALOGO');
        return { response: FLOWS.CATALOGO, shouldSaveOrcamento: false };
    }

    // Verificar gatilhos de orçamento
    if (TRIGGERS.ORCAMENTO.some(trigger => normalizedMessage === trigger || normalizedMessage.includes(trigger))) {
        setUserState(number, 'ORCAMENTO');
        return { response: FLOWS.ORCAMENTO, shouldSaveOrcamento: false };
    }

    // Verificar gatilhos de atendente
    if (TRIGGERS.ATENDENTE.some(trigger => normalizedMessage === trigger || normalizedMessage.includes(trigger))) {
        setUserState(number, 'ATENDENTE');
        return { response: FLOWS.ATENDENTE, shouldSaveOrcamento: false };
    }

    // Verificar gatilhos de depoimentos
    if (TRIGGERS.DEPOIMENTOS.some(trigger => normalizedMessage === trigger || normalizedMessage.includes(trigger))) {
        setUserState(number, 'DEPOIMENTOS');
        return { response: FLOWS.DEPOIMENTOS, shouldSaveOrcamento: false };
    }

    // Verificar gatilhos de fotos
    if (TRIGGERS.FOTOS.some(trigger => normalizedMessage === trigger || normalizedMessage.includes(trigger))) {
        setUserState(number, 'FOTOS');
        return { response: FLOWS.FOTOS, shouldSaveOrcamento: false };
    }

    // Se o usuário está no estado de orçamento
    if (currentState === 'ORCAMENTO') {
        // Detectar se é um orçamento válido
        const isOrcamento =
            normalizedMessage.includes('produto:') ||
            message.length > 50 ||
            hasImage;

        if (isOrcamento) {
            const response = `✅ Orçamento recebido com sucesso!

Nossa equipe vai analisar e retornar em até 2 horas. 

Enquanto isso, que tal ver nosso catálogo? Digite *1*

Ou volte ao menu principal: Digite *0*`;

            setUserState(number, null);
            return { response, shouldSaveOrcamento: true };
        }
    }

    // Se o usuário está falando com atendente
    if (currentState === 'ATENDENTE') {
        return {
            response: `Mensagem encaminhada para nossa equipe! ✅\n\nRetornaremos em breve.\n\nMenu principal? Digite *0*`,
            shouldSaveOrcamento: false
        };
    }

    // Mensagem não reconhecida
    return { response: FLOWS.NAO_ENTENDI, shouldSaveOrcamento: false };
}

module.exports = {
    processMessage,
    setUserState,
    getUserState,
    FLOWS,
    TRIGGERS
};
