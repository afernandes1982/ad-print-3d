import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Configura variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Resolver caminhos de arquivos para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para JSON e CORS simples sem precisar de outro pacote
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Banco de Dados em Arquivos JSON
const ORDERS_FILE = path.join(__dirname, 'db-orders.json');
const SETTINGS_FILE = path.join(__dirname, 'db-settings.json');

// Inicializa arquivos do banco se não existirem
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

const DEFAULT_SETTINGS = {
  pixKeyType: 'Chave Pix',
  pixKeyCode: '',
  pixBeneficiary: 'AD PRINT 3D',
  mercadoPagoPublicKey: 'APP_USR-daee92c8-8df0-4b68-b302-placeholder',
  mercadoPagoAccessToken: 'APP_USR-daee92c8-8df0-4b68-b302-token-placeholder',
  whatsappNumber: '5511985331188',
  freeShippingThreshold: 299.90,
  instagramUrl: 'https://instagram.com/adprint3d',
  tiktokUrl: 'https://tiktok.com/@adprint3d',
  maintenanceMode: 'Não - Site ativo normal no ar',
  heroTitle: 'Estímulo, Foco & Calma em Impressão 3D',
  heroSubtitle: 'Brinquedos articulados e fidgets relaxantes projetados especialmente para apoiar a autorregulação no TEA (Autismo), TDAH e Ansiedade. Feitos sob encomenda pela AD PRINT 3D com ligas biodegradáveis de PLA térmico ultra seguro.'
};

if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
}

// Funções Auxiliares de Leitura/Escrita
function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function readSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// ----------------------------------------------------
// ROTAS DA API
// ----------------------------------------------------

// 1. Obter Configurações
app.get('/api/settings', (req, res) => {
  const settings = readSettings();
  res.json(settings);
});

// 2. Atualizar Configurações
app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  writeSettings(newSettings);
  res.json({ success: true, settings: newSettings });
});

// 3. Obter Status de um Pedido
app.get('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado' });
  }
  res.json(order);
});

// 4. Listar Todos os Pedidos (Admin)
app.get('/api/admin/orders', (req, res) => {
  res.json(readOrders());
});

// 5. Atualizar Status de um Pedido (Admin)
app.put('/api/admin/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pedido não encontrado' });
  }
  orders[index].orderStatus = status;
  writeOrders(orders);
  res.json({ success: true, order: orders[index] });
});

// 6. Rota de Checkout (Criação de Cobrança com Mercado Pago)
app.post('/api/checkout', async (req, res) => {
  const { customerName, customerEmail, customerPhone, items, paymentMethod, deliveryMethod, zip, address, num, state, total, discount, shipping } = req.body;

  const settings = readSettings();
  const orders = readOrders();

  // Verifica se a URL do app é local (se for, não podemos passar a notification_url para o Mercado Pago)
  const appUrl = process.env.APP_URL || '';
  const isLocal = !appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const notificationUrl = isLocal ? undefined : `${appUrl}/api/webhook`;

  // Gera um ID de pedido único
  const orderId = 'AD' + Math.floor(Math.random() * 900000 + 100000);
  const formattedDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Cria objeto de pedido básico
  const newOrder = {
    id: orderId,
    customerName,
    customerEmail,
    customerPhone,
    items,
    total,
    discount,
    shipping,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    deliveryMethod,
    address: `${address}, ${num} - ${state} (${zip})`,
    createdAt: formattedDate,
    mercadoPagoId: null,
    pixCode: null,
    pixQrCodeBase64: null,
    paymentUrl: null
  };

  // Pega o token do Mercado Pago das configurações (prioriza .env se houver)
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || settings.mercadoPagoAccessToken;

  if (!mpToken || mpToken.includes('placeholder')) {
    // Se não houver token válido, simula uma venda pendente sem erro crítico
    orders.push(newOrder);
    writeOrders(orders);
    return res.json({
      success: true,
      simulation: true,
      order: newOrder,
      message: 'Modo de Simulação Ativo (Insira as credenciais do Mercado Pago no painel administrativo).'
    });
  }

  try {
    // Inicializa cliente Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: mpToken });

    if (paymentMethod === 'pix') {
      const payment = new Payment(client);
      
      // Criação de pagamento PIX seguro via API direta
      const paymentData = {
        body: {
          transaction_amount: Number(total),
          description: `Pedido ${orderId} - AD Print 3D`,
          payment_method_id: 'pix',
          payer: {
            email: customerEmail,
            first_name: customerName.split(' ')[0] || 'Cliente',
            last_name: customerName.split(' ').slice(1).join(' ') || 'Fidgets',
            identification: {
              type: 'CPF',
              number: '19100000000' // CPF de teste padrão do MP (em sandbox aceita qualquer CPF de teste)
            }
          },
          notification_url: notificationUrl
        }
      };

      const result = await payment.create(paymentData);

      newOrder.mercadoPagoId = result.id;
      newOrder.pixCode = result.point_of_interaction.transaction_data.qr_code;
      newOrder.pixQrCodeBase64 = result.point_of_interaction.transaction_data.qr_code_base64;

    } else {
      // Para Cartão de Crédito, criamos uma preferência de redirecionamento (Checkout Pro)
      // É a forma mais segura de evitar lidar com formulários de cartão sensíveis no nosso código
      const preference = new Preference(client);

      // O Mercado Pago exige URLs públicas HTTPS quando auto_return está ativo.
      // Em ambiente local (localhost), usamos uma URL fictícia pública para contornar essa validação.
      const backUrls = isLocal
        ? {
            success: `https://www.google.com/?status=success&orderId=${orderId}`,
            failure: `https://www.google.com/?status=failure`,
            pending: `https://www.google.com/?status=pending`
          }
        : {
            success: `${appUrl}/?status=success&orderId=${orderId}`,
            failure: `${appUrl}/?status=failure`,
            pending: `${appUrl}/?status=pending`
          };

      const preferenceData = {
        body: {
          items: items.map(item => ({
            id: item.productId,
            title: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price)
          })),
          payer: {
            name: customerName,
            email: customerEmail,
            phone: { number: customerPhone }
          },
          back_urls: backUrls,
          auto_return: isLocal ? undefined : 'approved',
          external_reference: orderId,
          notification_url: notificationUrl
        }
      };

      const result = await preference.create(preferenceData);
      newOrder.mercadoPagoId = result.id;
      // Link para onde redirecionar o usuário para ele pagar com cartão de forma segura
      newOrder.paymentUrl = result.init_point;
    }

    orders.push(newOrder);
    writeOrders(orders);
    res.json({ success: true, order: newOrder });

  } catch (error) {
    console.error('Erro no Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao gerar o pagamento com o Mercado Pago. Detalhes no console do servidor.' });
  }
});

// 7. Webhook do Mercado Pago (Recebe aviso quando o pagamento for aprovado)
app.post('/api/webhook', async (req, res) => {
  const { action, data } = req.body;

  // Mercado Pago envia notificações quando o pagamento é atualizado
  if (action === 'payment.created' || action === 'payment.updated' || req.query.topic === 'payment') {
    const paymentId = data?.id || req.query.id;
    const settings = readSettings();
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || settings.mercadoPagoAccessToken;

    if (paymentId && mpToken && !mpToken.includes('placeholder')) {
      try {
        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
          const orders = readOrders();
          
          // Tenta achar o pedido pelo ID do Mercado Pago ou pela external_reference ( Checkout Pro )
          const orderIndex = orders.findIndex(o => 
            String(o.mercadoPagoId) === String(paymentId) || 
            String(o.id) === String(paymentInfo.external_reference)
          );

          if (orderIndex !== -1) {
            orders[orderIndex].paymentStatus = 'paid';
            orders[orderIndex].orderStatus = 'preparing'; // Entra na fila de impressão 3D
            writeOrders(orders);
            console.log(`[Webhook] Pedido ${orders[orderIndex].id} pago e aprovado com sucesso!`);
          }
        }
      } catch (err) {
        console.error('[Webhook Error]:', err);
      }
    }
  }

  // Sempre retorne 200 OK para o Mercado Pago não tentar reenviar
  res.sendStatus(200);
});

// Servir o Frontend compilado (Vite production build)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`📂 DB Pedidos: ${ORDERS_FILE}`);
  console.log(`📂 DB Configurações: ${SETTINGS_FILE}`);
});
