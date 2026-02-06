# 🤖 WhatsApp Bot - Sabores da Dori

Bot de atendimento automático para confeitaria integrado com Evolution API.

## 📋 Pré-requisitos

- Node.js 18 ou superior
- Evolution API rodando (hospedada no Railway ou outro servidor)
- Conta Railway (para deploy do webhook)

## 🚀 Instalação Local

1. **Clone ou baixe o projeto**

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
EVOLUTION_API_URL=https://sua-evolution-api.railway.app
EVOLUTION_API_KEY=sua-chave-api
INSTANCE_NAME=confeitaria-bot
PORT=3000
WEBHOOK_URL=https://seu-webhook.railway.app/webhook
```

4. **Inicie o servidor**

Desenvolvimento (com auto-reload):
```bash
npm run dev
```

Produção:
```bash
npm start
```

## 🧪 Teste Local com ngrok

Para testar localmente antes do deploy:

1. **Instale o ngrok**: https://ngrok.com/download

2. **Inicie o servidor local**:
```bash
npm run dev
```

3. **Em outro terminal, inicie o ngrok**:
```bash
ngrok http 3000
```

4. **Copie a URL HTTPS gerada** (ex: `https://abc123.ngrok.io`)

5. **Configure o webhook** (veja seção abaixo)

## ⚙️ Configuração do Webhook na Evolution API

Após fazer deploy ou iniciar o ngrok, configure o webhook:

### Usando cURL:

```bash
curl -X POST https://sua-evolution-api.railway.app/webhook/set/confeitaria-bot \
  -H "apikey: sua-chave-api" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-webhook.railway.app/webhook",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

### Usando o endpoint do próprio bot:

```bash
curl -X POST https://seu-webhook.railway.app/configure-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://seu-webhook.railway.app/webhook"
  }'
```

## 🌐 Deploy no Railway

1. **Crie uma conta no Railway**: https://railway.app

2. **Crie um novo projeto**:
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo" ou "Empty Project"

3. **Configure as variáveis de ambiente**:
   - Vá em "Variables"
   - Adicione todas as variáveis do arquivo `.env`

4. **Deploy**:
   - Se usar GitHub: conecte o repositório e o deploy será automático
   - Se usar CLI: instale Railway CLI e execute `railway up`

5. **Obtenha a URL do deploy**:
   - Railway gerará uma URL automática (ex: `https://seu-projeto.up.railway.app`)
   - Use essa URL como `WEBHOOK_URL`

6. **Configure o webhook** usando a URL do Railway

## 📁 Estrutura do Projeto

```
whatsapp-bot-confeitaria/
├── server.js           # Servidor webhook Express
├── flows.js            # Fluxos de conversa e lógica
├── evolutionAPI.js     # Cliente para Evolution API
├── orcamentos.js       # Sistema de salvamento de orçamentos
├── package.json        # Dependências do projeto
├── Procfile           # Configuração Railway
├── .env.example       # Template de variáveis de ambiente
├── .gitignore         # Arquivos ignorados pelo Git
├── orcamentos.json    # Banco de dados de orçamentos (gerado automaticamente)
└── README.md          # Este arquivo
```

## 💬 Fluxos de Conversa

O bot responde aos seguintes comandos:

### Menu Principal
Gatilhos: `oi`, `olá`, `menu`, `começar`, `0`

### Opções:
1. **Ver Catálogo** - Gatilhos: `1`, `catalogo`, `produtos`
2. **Fazer Orçamento** - Gatilhos: `2`, `orcamento`, `preço`
3. **Falar com Atendente** - Gatilhos: `3`, `atendente`, `humano`
4. **Ver Depoimentos** - Gatilhos: `4`, `depoimentos`, `avaliacoes`

### Recursos Adicionais:
- **Ver Fotos** - Gatilhos: `fotos`, `imagens`, `galeria`

## 📊 Estrutura dos Orçamentos

Os orçamentos são salvos em `orcamentos.json` com a seguinte estrutura:

```json
{
  "id": 1707145234567,
  "numero": "5511999999999@s.whatsapp.net",
  "mensagem": "Produto: Bolo\nSabor: Chocolate\nQuantidade: 2kg\nData: 15/02/2026\nEntrega: Rua ABC, 123",
  "timestamp": "2026-02-05T16:30:00.000Z",
  "status": "novo",
  "temImagem": false
}
```

### Status possíveis:
- `novo` - Orçamento recém-recebido
- `em_andamento` - Sendo processado
- `concluido` - Finalizado

## 🔍 Endpoints da API

### `GET /`
Health check do servidor
```json
{
  "status": "online",
  "service": "WhatsApp Bot - Sabores da Dori",
  "timestamp": 1707145234567,
  "uptime": 3600
}
```

### `GET /status`
Verifica status da instância Evolution API
```json
{
  "success": true,
  "instance": "confeitaria-bot",
  "status": { ... }
}
```

### `POST /webhook`
Recebe eventos da Evolution API (configurado automaticamente)

### `POST /configure-webhook`
Configura webhook na Evolution API
```json
{
  "webhookUrl": "https://seu-webhook.railway.app/webhook"
}
```

## 🛠️ Funcionalidades

- ✅ Atendimento automático 24/7
- ✅ Fluxos de conversa inteligentes
- ✅ Salvamento automático de orçamentos
- ✅ Detecção de imagens em orçamentos
- ✅ Sistema de estados por usuário
- ✅ Retry automático com exponential backoff
- ✅ Logs detalhados com timestamp
- ✅ Tratamento robusto de erros
- ✅ Health check para monitoramento

## 📝 Logs

Todos os eventos são logados com timestamp:

```
[2026-02-05T16:30:00.000Z] 📨 Webhook recebido
[2026-02-05T16:30:00.100Z] 💬 Mensagem de 5511999999999@s.whatsapp.net: "oi"
[2026-02-05T16:30:00.200Z] Processando mensagem de 5511999999999@s.whatsapp.net: "oi" (Estado: null)
[2026-02-05T16:30:00.300Z] Enviando mensagem para 5511999999999@s.whatsapp.net
[2026-02-05T16:30:00.500Z] ✅ Resposta enviada
```

## 🔧 Troubleshooting

### Servidor não inicia
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que a porta não está em uso

### Mensagens não são recebidas
- Verifique se o webhook está configurado corretamente na Evolution API
- Confirme que a instância está conectada
- Teste o endpoint `/status`

### Erros ao enviar mensagens
- Verifique a `EVOLUTION_API_KEY`
- Confirme que a `EVOLUTION_API_URL` está correta
- Verifique os logs para detalhes do erro

## 📞 Suporte

Para problemas ou dúvidas:
- Verifique os logs do servidor
- Teste os endpoints manualmente
- Revise a configuração das variáveis de ambiente

## 📄 Licença

MIT
