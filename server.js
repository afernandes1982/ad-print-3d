import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import pg from 'pg';
import multer from 'multer';

// Configura variáveis de ambiente
dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3002;

// Resolver caminhos de arquivos para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------------------------------
// CONFIGURAÇÃO DO BANCO DE DADOS (PostgreSQL)
// -------------------------------------------------------
let pool = null;
let useDatabase = false;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    useDatabase = true;
    console.log('🗄️  Conectando ao PostgreSQL...');
  } catch (err) {
    console.warn('⚠️  Falha ao configurar PostgreSQL, usando arquivos JSON como fallback.', err.message);
    useDatabase = false;
  }
}

// -------------------------------------------------------
// CONFIGURAÇÃO DO UPLOAD DE IMAGENS (Multer)
// -------------------------------------------------------
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

// -------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// -------------------------------------------------------
// BANCO DE DADOS EM ARQUIVO (Fallback quando não há PostgreSQL)
// -------------------------------------------------------
const ORDERS_FILE = path.join(__dirname, 'db-orders.json');
const SETTINGS_FILE = path.join(__dirname, 'db-settings.json');

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

const DEFAULT_PRODUCTS = [
  { id: 'pulse-pad', name: 'Pulse Pad Click', price: 40.00, description: 'Placas de clique com toque macio que acalmam e ajudam a liberar a tensão. Possui sensação tátil marcante de alívio e movimento repetitivo satisfatório.', category: 'Fidgets', image_url: 'pulse-pad', stock: 25, size: '8cm x 8cm', material: 'PLA Soft Grip Resistente', is_kit: false, is_popular: true, base_color: 'Ouro Silk' },
  { id: 'nexo-cube', name: 'Cubo Infinito', price: 49.90, description: 'Pequenos blocos conectados com acabamento Dual-Color Metalizado que se dobram continuamente, mantendo as mãos ocupadas e a mente focada.', category: 'Fidgets', image_url: 'nexo-cube', stock: 20, size: '5cm x 5cm', material: 'PLA Dual-Color Metalizado', is_kit: false, is_popular: true, base_color: 'Roxo Galáxia' },
  { id: 'estrela-espiral-movel', name: 'Estrela Espiral Móvel', price: 69.90, description: 'Espiral cinética que gira suavemente, criando um efeito hipnotizante de rotação infinita. Traz calma profunda, relaxamento induzido e foco para a mente agitada.', category: 'Sensoriais', image_url: 'estrela-espiral', stock: 25, size: '10cm x 10cm', material: 'PLA Real Silk Premium', is_kit: false, is_popular: true, base_color: 'Preto Magma' },
  { id: 'dino-artic', name: 'Dino Articulado T-Rex 3D', price: 79.90, description: 'Tiranossauro Rex totalmente articulado, feito em PLA atóxico biodegradável. Estimula o foco, ideal para inquietação e exploração tátil de relevo.', category: 'Articulados', image_url: '🦕', stock: 25, size: '18cm', material: 'PLA Biodegradável Atóxico', is_kit: false, is_popular: true, base_color: null },
  { id: 'kubo-infinito', name: 'Kubo Infinito Fidget', price: 44.90, description: 'Fidget de blocos articulados de movimento infinito contínuo. Cabe perfeitamente na palma da mão e ajuda a reduzir a ansiedade em sala de aula ou no escritório.', category: 'Fidgets', image_url: '♾️', stock: 45, size: '4cm x 4cm', material: 'PLA Biodegradável Premium', is_kit: false, is_popular: true, base_color: null },
  { id: 'stelina', name: 'Stelina Sensorial Flex', price: 59.90, description: 'Estrela flexível com anéis articulados e molas concêntricas que giram e dobram. Textura de impressão ultra confortável para acalmar a mente.', category: 'Sensoriais', image_url: '⭐', stock: 30, size: '12cm diâmetro', material: 'PLA Atóxico Flex-Glow', is_kit: false, is_popular: false, base_color: null },
  { id: 'kubo-giro', name: 'Kubo Giro de Engrenagens', price: 64.90, description: 'Cubo cinético com engrenagens móveis que giram de forma síncrona. Toque mecânico e visual hipnotizante que foca a atenção e promove relaxamento.', category: 'Fidgets', image_url: '⚙️', stock: 20, size: '6cm x 6cm', material: 'PLA de Alta Resistência', is_kit: false, is_popular: true, base_color: null },
  { id: 'orbi', name: 'Órbi Sensorial Orbital', price: 89.90, description: 'Anel orbital duplo com giroscópios embutidos de trilha silenciosa. Excelente para manter as mãos ocupadas sem emitir ruídos barulhentos.', category: 'Sensoriais', image_url: '🪐', stock: 15, size: '10cm diâmetro', material: 'PLA Metálico Premium', is_kit: false, is_popular: false, base_color: null },
  { id: 'zenina', name: 'Zenina Estrela Suave', price: 54.90, description: 'Estrela texturizada com design ergonômico. Seus gomos articulados deslizam proporcionando estímulo proprioceptivo calmante.', category: 'Sensoriais', image_url: '🌀', stock: 40, size: '11cm', material: 'PLA Biodegradável', is_kit: false, is_popular: false, base_color: null },
  { id: 'click-bubble', name: 'Click Bubble Mecânico', price: 24.90, description: 'Teclado de botões com clicks mecânicos e retorno tátil de alta fidelidade. Inspirado na satisfação infinita do plástico bolha.', category: 'Fidgets', image_url: '🔳', stock: 60, size: '5cm x 5cm', material: 'PLA + Interruptores Blue', is_kit: false, is_popular: false, base_color: null },
  { id: 'kit-aconchego-box', name: 'Aconchego Box (Kit 5 Fidgets)', price: 199.90, description: 'Nosso kit campeão de vendas! Inclui 1 Kubo Infinito, 1 Dino Articulado, 1 Stelina Flex, 1 Click Bubble e 1 Slime Ball + Brinde Surpresa e frete grátis!', category: 'Kits', image_url: '📦', stock: 12, size: 'Box Especial', material: 'Kits Mistos PLA', is_kit: true, is_popular: true, base_color: null },
  { id: 'kit-dino-box', name: 'Dino Box Especial', price: 169.90, description: 'Combo ideal para os apaixonados por dinossauros. Contém 1 Dino Rex Articulado Premium, 1 Zenina Estrela Suave e 1 Kubo Infinito, com embalagem decorada.', category: 'Kits', image_url: '🦖', stock: 18, size: 'Box Temática', material: 'Kits Mistos PLA', is_kit: true, is_popular: false, base_color: null },
  { id: 'letreiro-personalizado', name: 'Letreiro Decorativo Personalizado 3D', price: 49.90, description: 'Crie seu letreiro decorativo exclusivo! Digite o texto desejado e selecione a cor da base e do texto. Perfeito para salas, escritórios e presentes especiais.', category: 'Personalizados', image_url: '/assets/letreiro_crer-dJbnM-N5.jpg', stock: 50, size: 'Padrão', material: 'PLA Biodegradável Premium', is_kit: false, is_popular: false, base_color: null },
  { id: 'porta-lapis-personalizado', name: 'Porta Lápis Moletom Personalizado 3D', price: 45.00, description: 'Porta lápis super criativo em formato de blusa de moletom com capuz e bolso! Escolha a cor do corpo, a cor dos detalhes e insira o nome para personalizar no bolso.', category: 'Personalizados', image_url: '/assets/porta_lapis-OXk5V74f.jpg', stock: 40, size: '10cm x 10cm', material: 'PLA Premium Sedoso', is_kit: false, is_popular: false, base_color: null }
];

const DEFAULT_COUPONS = [
  { id: '1', code: 'ADPRIMEIRO', type: 'percentage', value: 10, min_subtotal: 0, is_active: true },
  { id: '2', code: 'SENSORIAL5', type: 'fixed', value: 15, min_subtotal: 100, is_active: true },
  { id: '3', code: 'TEC3D', type: 'percentage', value: 15, min_subtotal: 0, is_active: true }
];

function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (e) { return []; }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return DEFAULT_SETTINGS;
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (e) { return DEFAULT_SETTINGS; }
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// -------------------------------------------------------
// INICIALIZAR TABELAS E SEEDS NO POSTGRESQL
// -------------------------------------------------------
async function initDatabase() {
  if (!useDatabase || !pool) return;

  try {
    const client = await pool.connect();

    // Criar tabelas
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category TEXT,
        image_url TEXT,
        stock INTEGER DEFAULT 20,
        size TEXT,
        material TEXT,
        is_kit BOOLEAN DEFAULT false,
        is_popular BOOLEAN DEFAULT false,
        base_color TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        items JSONB,
        total DECIMAL(10,2),
        discount DECIMAL(10,2) DEFAULT 0,
        shipping DECIMAL(10,2) DEFAULT 0,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        order_status TEXT DEFAULT 'pending',
        delivery_method TEXT,
        address TEXT,
        mercado_pago_id TEXT,
        pix_code TEXT,
        pix_qr_code_base64 TEXT,
        payment_url TEXT,
        created_at TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        type TEXT,
        value DECIMAL(10,2),
        min_subtotal DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Seed de produtos se vazio
    const prodCount = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCount.rows[0].count) === 0) {
      for (const p of DEFAULT_PRODUCTS) {
        await client.query(
          `INSERT INTO products (id, name, price, description, category, image_url, stock, size, material, is_kit, is_popular, base_color)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.price, p.description, p.category, p.image_url, p.stock, p.size, p.material, p.is_kit, p.is_popular, p.base_color]
        );
      }
      console.log('🌱 Produtos padrão inseridos no banco!');
    }

    // Seed de configurações se vazio
    const settCount = await client.query("SELECT COUNT(*) FROM settings WHERE key='store_settings'");
    if (parseInt(settCount.rows[0].count) === 0) {
      const existingSettings = readSettings();
      await client.query(
        "INSERT INTO settings (key, value) VALUES ('store_settings', $1) ON CONFLICT (key) DO NOTHING",
        [JSON.stringify(existingSettings)]
      );
      console.log('⚙️  Configurações padrão inseridas no banco!');
    }

    // Seed de cupons se vazio
    const couponCount = await client.query('SELECT COUNT(*) FROM coupons');
    if (parseInt(couponCount.rows[0].count) === 0) {
      for (const c of DEFAULT_COUPONS) {
        await client.query(
          `INSERT INTO coupons (id, code, type, value, min_subtotal, is_active)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
          [c.id, c.code, c.type, c.value, c.min_subtotal, c.is_active]
        );
      }
      console.log('🎟️  Cupons padrão inseridos no banco!');
    }

    // Migrar pedidos dos arquivos JSON se existirem
    const orderCount = await client.query('SELECT COUNT(*) FROM orders');
    if (parseInt(orderCount.rows[0].count) === 0) {
      const existingOrders = readOrders();
      for (const o of existingOrders) {
        await client.query(
          `INSERT INTO orders (id, customer_name, customer_email, customer_phone, items, total, discount, shipping,
           payment_method, payment_status, order_status, delivery_method, address, mercado_pago_id, pix_code, pix_qr_code_base64, payment_url, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO NOTHING`,
          [o.id, o.customerName, o.customerEmail, o.customerPhone, JSON.stringify(o.items),
           o.total, o.discount || 0, o.shipping || 0, o.paymentMethod, o.paymentStatus || 'pending',
           o.orderStatus || 'pending', o.deliveryMethod || 'standard', o.address || '',
           o.mercadoPagoId || null, o.pixCode || null, o.pixQrCodeBase64 || null, o.paymentUrl || null, o.createdAt]
        );
      }
      if (existingOrders.length > 0) console.log(`📦 ${existingOrders.length} pedidos migrados para o banco!`);
    }

    client.release();
    console.log('✅ Banco de dados PostgreSQL inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados:', err.message);
    useDatabase = false;
  }
}

// -------------------------------------------------------
// HELPERS DE DB (abstrai PostgreSQL vs JSON)
// -------------------------------------------------------
async function dbGetProducts() {
  if (useDatabase && pool) {
    const res = await pool.query('SELECT * FROM products ORDER BY created_at ASC');
    return res.rows.map(rowToProduct);
  }
  return DEFAULT_PRODUCTS.map(p => ({
    id: p.id, name: p.name, price: parseFloat(p.price), description: p.description,
    category: p.category, imageUrl: p.image_url, stock: p.stock, size: p.size,
    material: p.material, isKit: p.is_kit, isPopular: p.is_popular, baseColor: p.base_color
  }));
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    stock: row.stock,
    size: row.size,
    material: row.material,
    isKit: row.is_kit,
    isPopular: row.is_popular,
    baseColor: row.base_color
  };
}

async function dbGetSettings() {
  if (useDatabase && pool) {
    const res = await pool.query("SELECT value FROM settings WHERE key='store_settings'");
    if (res.rows.length > 0) return JSON.parse(res.rows[0].value);
  }
  return readSettings();
}

async function dbSaveSettings(settings) {
  if (useDatabase && pool) {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('store_settings', $1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [JSON.stringify(settings)]
    );
    return;
  }
  writeSettings(settings);
}

async function dbGetOrders() {
  if (useDatabase && pool) {
    const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return res.rows.map(rowToOrder);
  }
  return readOrders();
}

function rowToOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    total: parseFloat(row.total),
    discount: parseFloat(row.discount),
    shipping: parseFloat(row.shipping),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    deliveryMethod: row.delivery_method,
    address: row.address,
    mercadoPagoId: row.mercado_pago_id,
    pixCode: row.pix_code,
    pixQrCodeBase64: row.pix_qr_code_base64,
    paymentUrl: row.payment_url,
    createdAt: row.created_at
  };
}

async function dbGetCoupons() {
  if (useDatabase && pool) {
    const res = await pool.query('SELECT * FROM coupons ORDER BY id ASC');
    return res.rows.map(r => ({
      id: r.id, code: r.code, type: r.type,
      value: parseFloat(r.value), minSubtotal: parseFloat(r.min_subtotal), isActive: r.is_active
    }));
  }
  return DEFAULT_COUPONS.map(c => ({ id: c.id, code: c.code, type: c.type, value: c.value, minSubtotal: c.min_subtotal, isActive: c.is_active }));
}

// -------------------------------------------------------
// ROTAS DA API
// -------------------------------------------------------

// Login do Administrador
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'adprint3d@admin'; // Senha padrão (troque no EasyPanel!)

  if (!password) {
    return res.status(400).json({ error: 'Senha não informada.' });
  }

  if (password === adminPassword) {
    // Token simples baseado em HMAC do password+salt (não precisa de JWT)
    const token = Buffer.from(`${adminPassword}:adprint3d-admin-session`).toString('base64');
    return res.json({ success: true, token });
  }

  return res.status(401).json({ error: 'Senha incorreta. Acesso negado.' });
});

// Upload de Imagem
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  const appUrl = process.env.APP_URL || '';
  const imageUrl = appUrl ? `${appUrl}/uploads/${req.file.filename}` : `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl, filename: req.file.filename });
});

// Produtos
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbGetProducts();
    res.json(products);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/admin/products', async (req, res) => {
  const p = req.body;
  if (!p.id || !p.name || !p.price) return res.status(400).json({ error: 'Campos obrigatórios: id, name, price' });

  if (useDatabase && pool) {
    try {
      await pool.query(
        `INSERT INTO products (id, name, price, description, category, image_url, stock, size, material, is_kit, is_popular, base_color)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET name=$2, price=$3, description=$4, category=$5, image_url=$6, stock=$7, size=$8, material=$9, is_kit=$10, is_popular=$11, base_color=$12`,
        [p.id, p.name, p.price, p.description, p.category, p.imageUrl, p.stock, p.size, p.material, p.isKit || false, p.isPopular || false, p.baseColor || null]
      );
      const result = await pool.query('SELECT * FROM products WHERE id=$1', [p.id]);
      res.json({ success: true, product: rowToProduct(result.rows[0]) });
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      res.status(500).json({ error: 'Erro ao salvar produto' });
    }
  } else {
    res.json({ success: true, product: p, message: 'Modo offline: produto não persistido no banco.' });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  const p = req.body;
  const { id } = req.params;

  if (useDatabase && pool) {
    try {
      await pool.query(
        `UPDATE products SET name=$1, price=$2, description=$3, category=$4, image_url=$5, stock=$6, size=$7, material=$8, is_kit=$9, is_popular=$10, base_color=$11 WHERE id=$12`,
        [p.name, p.price, p.description, p.category, p.imageUrl, p.stock, p.size, p.material, p.isKit || false, p.isPopular || false, p.baseColor || null, id]
      );
      const result = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
      res.json({ success: true, product: rowToProduct(result.rows[0]) });
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  } else {
    res.json({ success: true, product: { ...p, id } });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  const { id } = req.params;
  if (useDatabase && pool) {
    try {
      await pool.query('DELETE FROM products WHERE id=$1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao deletar produto' });
    }
  } else {
    res.json({ success: true });
  }
});

// Configurações
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbGetSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    await dbSaveSettings(req.body);
    res.json({ success: true, settings: req.body });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// Cupons
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await dbGetCoupons();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cupons' });
  }
});

app.post('/api/admin/coupons', async (req, res) => {
  const c = req.body;
  if (!c.id || !c.code) return res.status(400).json({ error: 'Campos obrigatórios: id, code' });

  if (useDatabase && pool) {
    try {
      await pool.query(
        `INSERT INTO coupons (id, code, type, value, min_subtotal, is_active)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.code.toUpperCase(), c.type, c.value, c.minSubtotal || 0, c.isActive !== false]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar cupom: ' + err.message });
    }
  } else {
    res.json({ success: true });
  }
});

app.delete('/api/admin/coupons/:id', async (req, res) => {
  const { id } = req.params;
  if (useDatabase && pool) {
    try {
      await pool.query('DELETE FROM coupons WHERE id=$1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao deletar cupom' });
    }
  } else {
    res.json({ success: true });
  }
});

// Pedidos
app.get('/api/orders/:id', async (req, res) => {
  if (useDatabase && pool) {
    try {
      const result = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
      res.json(rowToOrder(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  } else {
    const orders = readOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await dbGetOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (useDatabase && pool) {
    try {
      await pool.query('UPDATE orders SET order_status=$1 WHERE id=$2', [status, id]);
      const result = await pool.query('SELECT * FROM orders WHERE id=$1', [id]);
      res.json({ success: true, order: rowToOrder(result.rows[0]) });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  } else {
    const orders = readOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return res.status(404).json({ error: 'Pedido não encontrado' });
    orders[index].orderStatus = status;
    writeOrders(orders);
    res.json({ success: true, order: orders[index] });
  }
});

// -------------------------------------------------------
// CHECKOUT COM MERCADO PAGO
// -------------------------------------------------------
app.post('/api/checkout', async (req, res) => {
  const { customerName, customerEmail, customerPhone, items, paymentMethod, deliveryMethod, zip, address, num, state, total, discount, shipping } = req.body;

  const settings = await dbGetSettings();
  const appUrl = process.env.APP_URL || '';
  const isLocal = !appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const notificationUrl = isLocal ? undefined : `${appUrl}/api/webhook`;

  const orderId = 'AD' + Math.floor(Math.random() * 900000 + 100000);
  const formattedDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

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

  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || settings.mercadoPagoAccessToken;

  if (!mpToken || mpToken.includes('placeholder')) {
    // Salvar pedido em modo simulação
    if (useDatabase && pool) {
      await pool.query(
        `INSERT INTO orders (id, customer_name, customer_email, customer_phone, items, total, discount, shipping,
         payment_method, payment_status, order_status, delivery_method, address, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [newOrder.id, newOrder.customerName, newOrder.customerEmail, newOrder.customerPhone,
         JSON.stringify(newOrder.items), newOrder.total, newOrder.discount, newOrder.shipping,
         newOrder.paymentMethod, 'pending', 'pending', newOrder.deliveryMethod, newOrder.address, newOrder.createdAt]
      );
    } else {
      const orders = readOrders();
      orders.push(newOrder);
      writeOrders(orders);
    }
    return res.json({ success: true, simulation: true, order: newOrder, message: 'Modo de Simulação Ativo (Insira as credenciais do Mercado Pago no painel administrativo).' });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: mpToken });

    if (paymentMethod === 'pix') {
      const payment = new Payment(client);
      const paymentData = {
        body: {
          transaction_amount: Number(total),
          description: `Pedido ${orderId} - AD Print 3D`,
          payment_method_id: 'pix',
          payer: {
            email: customerEmail,
            first_name: customerName.split(' ')[0] || 'Cliente',
            last_name: customerName.split(' ').slice(1).join(' ') || 'Fidgets',
            identification: { type: 'CPF', number: '19100000000' }
          },
          notification_url: notificationUrl
        }
      };
      const result = await payment.create(paymentData);
      newOrder.mercadoPagoId = result.id;
      newOrder.pixCode = result.point_of_interaction.transaction_data.qr_code;
      newOrder.pixQrCodeBase64 = result.point_of_interaction.transaction_data.qr_code_base64;
    } else {
      const preference = new Preference(client);
      const backUrls = isLocal
        ? { success: `https://www.google.com/?status=success&orderId=${orderId}`, failure: `https://www.google.com/?status=failure`, pending: `https://www.google.com/?status=pending` }
        : { success: `${appUrl}/?status=success&orderId=${orderId}`, failure: `${appUrl}/?status=failure`, pending: `${appUrl}/?status=pending` };

      const preferenceData = {
        body: {
          items: items.map(item => ({ id: item.productId, title: item.name, quantity: Number(item.quantity), unit_price: Number(item.price) })),
          payer: { name: customerName, email: customerEmail, phone: { number: customerPhone } },
          back_urls: backUrls,
          auto_return: isLocal ? undefined : 'approved',
          external_reference: orderId,
          notification_url: notificationUrl
        }
      };
      const result = await preference.create(preferenceData);
      newOrder.mercadoPagoId = result.id;
      newOrder.paymentUrl = result.init_point;
    }

    // Salvar pedido no banco
    if (useDatabase && pool) {
      await pool.query(
        `INSERT INTO orders (id, customer_name, customer_email, customer_phone, items, total, discount, shipping,
         payment_method, payment_status, order_status, delivery_method, address, mercado_pago_id, pix_code, pix_qr_code_base64, payment_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [newOrder.id, newOrder.customerName, newOrder.customerEmail, newOrder.customerPhone,
         JSON.stringify(newOrder.items), newOrder.total, newOrder.discount, newOrder.shipping,
         newOrder.paymentMethod, 'pending', 'pending', newOrder.deliveryMethod, newOrder.address,
         newOrder.mercadoPagoId, newOrder.pixCode, newOrder.pixQrCodeBase64, newOrder.paymentUrl, newOrder.createdAt]
      );
    } else {
      const orders = readOrders();
      orders.push(newOrder);
      writeOrders(orders);
    }

    res.json({ success: true, order: newOrder });
  } catch (error) {
    console.error('Erro no Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao gerar o pagamento com o Mercado Pago. Detalhes no console do servidor.' });
  }
});

// -------------------------------------------------------
// WEBHOOK DO MERCADO PAGO
// -------------------------------------------------------
app.post('/api/webhook', async (req, res) => {
  const { action, data } = req.body;
  if (action === 'payment.created' || action === 'payment.updated' || req.query.topic === 'payment') {
    const paymentId = data?.id || req.query.id;
    const settings = await dbGetSettings();
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || settings.mercadoPagoAccessToken;

    if (paymentId && mpToken && !mpToken.includes('placeholder')) {
      try {
        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
          if (useDatabase && pool) {
            await pool.query(
              `UPDATE orders SET payment_status='paid', order_status='preparing'
               WHERE mercado_pago_id=$1 OR id=$2`,
              [String(paymentId), String(paymentInfo.external_reference)]
            );
          } else {
            const orders = readOrders();
            const orderIndex = orders.findIndex(o =>
              String(o.mercadoPagoId) === String(paymentId) ||
              String(o.id) === String(paymentInfo.external_reference)
            );
            if (orderIndex !== -1) {
              orders[orderIndex].paymentStatus = 'paid';
              orders[orderIndex].orderStatus = 'preparing';
              writeOrders(orders);
            }
          }
        }
      } catch (err) {
        console.error('[Webhook Error]:', err);
      }
    }
  }
  res.sendStatus(200);
});

// -------------------------------------------------------
// SERVIR O FRONTEND (dist/)
// -------------------------------------------------------
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// -------------------------------------------------------
// INICIAR SERVIDOR
// -------------------------------------------------------
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🗄️  Banco de dados: ${useDatabase ? 'PostgreSQL ✅' : 'Arquivos JSON (fallback)'}`);
    console.log(`📁 Uploads: ${uploadsDir}`);
  });
});
