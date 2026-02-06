const axios = require('axios');

/**
 * Cliente para interagir com a Evolution API
 */
class EvolutionAPIClient {
  constructor() {
    this.baseURL = process.env.EVOLUTION_API_URL;
    this.apiKey = process.env.EVOLUTION_API_KEY;
    this.instanceName = process.env.INSTANCE_NAME;

    if (!this.baseURL || !this.apiKey || !this.instanceName) {
      throw new Error('Variáveis de ambiente Evolution API não configuradas corretamente');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Configurar retry com exponential backoff
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const config = error.config;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry >= 3) {
          return Promise.reject(error);
        }

        config.retry += 1;
        const delay = Math.pow(2, config.retry) * 1000; // 2s, 4s, 8s
        
        console.log(`[${new Date().toISOString()}] Retry ${config.retry}/3 após ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.client(config);
      }
    );
  }

  /**
   * Formata número de telefone para padrão internacional
   * @param {string} number - Número de telefone
   * @returns {string} Número formatado
   */
  formatPhoneNumber(number) {
    // Remove caracteres não numéricos
    let cleaned = number.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    // Adiciona @s.whatsapp.net se não tiver
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@s.whatsapp.net';
    }
    
    return cleaned;
  }

  /**
   * Envia mensagem de texto
   * @param {string} number - Número do destinatário
   * @param {string} text - Texto da mensagem
   * @returns {Promise<Object>} Resposta da API
   */
  async sendTextMessage(number, text) {
    try {
      const formattedNumber = this.formatPhoneNumber(number);
      
      console.log(`[${new Date().toISOString()}] Enviando mensagem para ${formattedNumber}`);
      
      const response = await this.client.post(`/message/sendText/${this.instanceName}`, {
        number: formattedNumber,
        text: text
      });

      console.log(`[${new Date().toISOString()}] Mensagem enviada com sucesso`);
      return response.data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao enviar mensagem:`, error.message);
      throw error;
    }
  }

  /**
   * Envia imagem com legenda
   * @param {string} number - Número do destinatário
   * @param {string} imageUrl - URL da imagem
   * @param {string} caption - Legenda da imagem
   * @returns {Promise<Object>} Resposta da API
   */
  async sendImage(number, imageUrl, caption = '') {
    try {
      const formattedNumber = this.formatPhoneNumber(number);
      
      console.log(`[${new Date().toISOString()}] Enviando imagem para ${formattedNumber}`);
      
      const response = await this.client.post(`/message/sendMedia/${this.instanceName}`, {
        number: formattedNumber,
        mediatype: 'image',
        media: imageUrl,
        caption: caption
      });

      console.log(`[${new Date().toISOString()}] Imagem enviada com sucesso`);
      return response.data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao enviar imagem:`, error.message);
      throw error;
    }
  }

  /**
   * Obtém status da instância
   * @returns {Promise<Object>} Status da instância
   */
  async getInstanceStatus() {
    try {
      console.log(`[${new Date().toISOString()}] Verificando status da instância ${this.instanceName}`);
      
      const response = await this.client.get(`/instance/connectionState/${this.instanceName}`);
      
      console.log(`[${new Date().toISOString()}] Status:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao obter status:`, error.message);
      throw error;
    }
  }

  /**
   * Configura webhook para receber mensagens
   * @param {string} webhookUrl - URL do webhook
   * @returns {Promise<Object>} Resposta da API
   */
  async configureWebhook(webhookUrl) {
    try {
      console.log(`[${new Date().toISOString()}] Configurando webhook: ${webhookUrl}`);
      
      const response = await this.client.post(`/webhook/set/${this.instanceName}`, {
        url: webhookUrl,
        webhook_by_events: false,
        events: ['MESSAGES_UPSERT']
      });

      console.log(`[${new Date().toISOString()}] Webhook configurado com sucesso`);
      return response.data;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro ao configurar webhook:`, error.message);
      throw error;
    }
  }
}

module.exports = EvolutionAPIClient;
