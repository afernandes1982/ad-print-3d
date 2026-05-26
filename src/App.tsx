/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, OrderItem, ECommerceSettings, Coupon } from './types';
import { INITIAL_PRODUCTS } from './data/defaultProducts';
import Navbar from './components/Navbar';
import ProductCard, { PulsePadInteractive, NexoCubeInteractive, EstrelaEspiralInteractive } from './components/ProductCard';
import BoxBuilder from './components/BoxBuilder';
import AdminPanel from './components/AdminPanel';
import OrderTracker from './components/OrderTracker';
import CheckoutModal from './components/CheckoutModal';
import { useProductImageCleaner } from './hooks/useProductImageCleaner';
import { 
  ShoppingBag, Sparkles, ShieldCheck, Heart, Trash2, 
  Plus, Minus, ArrowRight, HelpCircle, Activity, Box, Zap, ExternalLink, X 
} from 'lucide-react';

const SEED_COUPONS: Coupon[] = [
  { id: '1', code: 'ADPRIMEIRO', type: 'percentage', value: 10, minSubtotal: 0, isActive: true },
  { id: '2', code: 'SENSORIAL5', type: 'fixed', value: 15, minSubtotal: 100, isActive: true },
  { id: '3', code: 'TEC3D', type: 'percentage', value: 15, minSubtotal: 0, isActive: true }
];

const SEED_ORDERS: Order[] = [
  {
    id: 'AD903125',
    customerName: 'Renata Albuquerque (Mamãe do Pedro)',
    customerEmail: 'renata.pedro@gmail.com',
    customerPhone: '(11) 98122-4411',
    items: [
      { productId: 'dino-artic-Vermelho Rubi-M', name: 'Dino Articulado T-Rex 3D (Vermelho Rubi | Tam: M)', price: 79.90, quantity: 1 },
      { productId: 'zenina-Ouro Silk-M', name: 'Zenina Estrela Suave (Ouro Silk | Tam: M)', price: 54.90, quantity: 1 }
    ],
    total: 134.80,
    discount: 0,
    shipping: 14.90,
    paymentMethod: 'pix',
    paymentStatus: 'paid',
    orderStatus: 'preparing',
    createdAt: '22/05/2026, 14:12'
  },
  {
    id: 'AD301490',
    customerName: 'Dra. Sandra Menezes (Terapeuta Ocupacional)',
    customerEmail: 'sandra.clinica@uol.com',
    customerPhone: '(21) 97103-3392',
    items: [
      { 
        productId: 'custom-box', 
        name: 'Box Sensorial Premium (5 itens)', 
        price: 189.90, 
        quantity: 1, 
        isBox: true, 
        boxItems: ['Dino Articulado T-Rex 3D', 'Kubo Infinito Fidget', 'Stelina Sensorial Flex', 'Kubo Giro de Engrenagens', 'Click Bubble Mecânico'] 
      }
    ],
    total: 189.90,
    discount: 81.30,
    shipping: 0,
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    orderStatus: 'shipped',
    createdAt: '21/05/2026, 09:34'
  }
];

const DEFAULT_SETTINGS: ECommerceSettings = {
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

export const FILAMENT_COLORS = [
  { name: 'Roxo Galáxia', hex: '#a855f7', category: 'Matte' },
  { name: 'Preto Carbono', hex: '#1e293b', category: 'Matte' },
  { name: 'Preto Magma', hex: '#0f172a', category: 'Matte' },
  { name: 'Azul Celeste', hex: '#3b82f6', category: 'Silk' },
  { name: 'Verde Esmeralda', hex: '#10b981', category: 'Silk' },
  { name: 'Vermelho Rubi', hex: '#ef4444', category: 'Matte' },
  { name: 'Ouro Silk', hex: '#fbbf24', category: 'Silk' },
  { name: 'Rosa Choque', hex: '#db2777', category: 'Matte' },
  { name: 'Cobre Metálico', hex: '#b45309', category: 'Silk' },
  { name: 'Prata Platinado', hex: '#cbd5e1', category: 'Silk' },
];

export default function App() {
  // Navigation
  const [currentTab, setTab] = useState<'shoppe' | 'box-builder' | 'about' | 'admin' | 'orders'>('shoppe');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Fidgets' | 'Articulados' | 'Sensoriais' | 'Kits' | 'Personalizados'>('Todos');

  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [settings, setSettings] = useState<ECommerceSettings>(DEFAULT_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSimulatorImageZoomed, setIsSimulatorImageZoomed] = useState(false);

  // Redesign state: active product in simulator
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // Customizer attributes state
  const [selectedColor, setSelectedColor] = useState(FILAMENT_COLORS[0]);
  const [selectedSecondaryColor, setSelectedSecondaryColor] = useState(FILAMENT_COLORS[1]);
  const [customText, setCustomText] = useState('');
  const [selectedSize, setSelectedSize] = useState<'P' | 'M' | 'G'>('M');

  const [filamentTab, setFilamentTab] = useState<'Ver Todos' | 'Silk' | 'Matte'>('Ver Todos');

  // Dynamic comments state per product
  const [productComments, setProductComments] = useState<Record<string, {name: string, rating: number, text: string, date: string}[]>>({
    'estrela-espiral-movel': [
      { name: 'CAROLINA RAMOS', rating: 5, text: 'O melhor brinquedo de engenharia que já vi. É super terapêutico ver as peças se encaixando e girando ao mesmo tempo. Comprei no filamento Cobre Metálico.', date: '11/05/2026' },
      { name: 'TIAGO DE SOUZA', rating: 5, text: 'Ajuda muito na regulação do foco. Deixo na mesa de estudos do meu filho e ele adora.', date: '20/05/2026' }
    ],
    'nexo-cube': [
      { name: 'RAFAEL MENDEZ', rating: 5, text: 'A rotação é extremamente suave, e o som das engrenagens dobrando é uma delícia. Super recomendo.', date: '15/05/2026' }
    ],
    'pulse-pad': [
      { name: 'LETÍCIA CASTRO', rating: 4, text: 'Gostei muito dos clicks mecânicos, são bem marcantes e firmes. O filamento Ouro Silk tem um brilho lindo.', date: '22/05/2026' }
    ]
  });

  // Comments form fields state
  const [commentName, setCommentName] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentText, setCommentText] = useState('');

  // Load from local storage
  useEffect(() => {
    const savedProducts = localStorage.getItem('ad_print_3d_products');
    const savedOrders = localStorage.getItem('ad_print_3d_orders');
    const savedCart = localStorage.getItem('ad_print_3d_cart');
    const savedSettings = localStorage.getItem('ad_print_3d_settings');
    const savedCoupons = localStorage.getItem('ad_print_3d_coupons');

    let loadedProducts: Product[] = [];
    if (savedProducts) {
      let parsed = JSON.parse(savedProducts);
      let changed = false;
      
      // Ensure Pulse Pad is present in the list
      const hasPulsePad = parsed.some((p: any) => p.id === 'pulse-pad' || p.imageUrl === 'pulse-pad');
      if (!hasPulsePad) {
        const pulsePadProduct: Product = {
          id: 'pulse-pad',
          name: 'Pulse Pad Click',
          price: 40.00,
          description: 'Placas de clique com toque macio que acalmam e ajudam a liberar a tensão. Possui sensação tátil marcante de alívio e movimento repetitivo satisfatório.',
          category: 'Fidgets',
          imageUrl: 'pulse-pad',
          stock: 25,
          size: '8cm x 8cm',
          material: 'PLA Soft Grip Resistente',
          isKit: false,
          isPopular: true,
          baseColor: 'Ouro Silk'
        };
        parsed = [pulsePadProduct, ...parsed];
        changed = true;
      }

      // Ensure Cubo Infinito is present
      const nexoIndex = parsed.findIndex((p: any) => p.id === 'nexo-cube' || p.imageUrl === 'nexo-cube');
      if (nexoIndex === -1) {
        const nexoCubeProduct: Product = {
          id: 'nexo-cube',
          name: 'Cubo Infinito',
          price: 49.90,
          description: 'Pequenos blocos conectados com acabamento Dual-Color Metalizado que se dobram continuamente, mantendo as mãos ocupadas e a mente focada. Rotação ultra-suave e excelente feedback proprioceptivo.',
          category: 'Fidgets',
          imageUrl: 'nexo-cube',
          stock: 20,
          size: '5cm x 5cm',
          material: 'PLA Dual-Color Metalizado',
          isKit: false,
          isPopular: true,
          baseColor: 'Roxo Galáxia'
        };
        parsed = [nexoCubeProduct, ...parsed];
        changed = true;
      }

      // Ensure Estrela Espiral Móvel is present
      const espiralIndex = parsed.findIndex((p: any) => p.id === 'estrela-espiral-movel');
      if (espiralIndex === -1) {
        const espiralProduct: Product = {
          id: 'estrela-espiral-movel',
          name: 'Estrela Espiral Móvel',
          price: 69.90,
          description: 'Espiral cinética que gira suavemente, criando um efeito hipnotizante de rotação infinita. Traz calma profunda, relaxamento induzido e foco para a mente agitada.',
          category: 'Sensoriais',
          imageUrl: 'estrela-espiral',
          stock: 25,
          size: '10cm x 10cm',
          material: 'PLA Real Silk Premium',
          isKit: false,
          isPopular: true,
          baseColor: 'Preto Magma'
        };
        parsed = [espiralProduct, ...parsed];
        changed = true;
      }

      INITIAL_PRODUCTS.forEach((defaultProd) => {
        const existingIdx = parsed.findIndex((p: any) => p.id === defaultProd.id);
        if (existingIdx === -1) {
          parsed.push(defaultProd);
          changed = true;
        } else if (parsed[existingIdx].imageUrl !== defaultProd.imageUrl && defaultProd.imageUrl.startsWith('https://')) {
          parsed[existingIdx].imageUrl = defaultProd.imageUrl;
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem('ad_print_3d_products', JSON.stringify(parsed));
      }
      setProducts(parsed);
      loadedProducts = parsed;
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('ad_print_3d_products', JSON.stringify(INITIAL_PRODUCTS));
      loadedProducts = INITIAL_PRODUCTS;
    }

    // Set initial active product
    if (loadedProducts.length > 0) {
      const defaultActive = loadedProducts.find(p => p.id === 'estrela-espiral-movel') || loadedProducts[0];
      setActiveProduct(defaultActive);
      if (defaultActive.baseColor) {
        const matchingColor = FILAMENT_COLORS.find(c => c.name === defaultActive.baseColor);
        if (matchingColor) setSelectedColor(matchingColor);
      }
    }

    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders(SEED_ORDERS);
    }
    // Fetch real orders from Express server
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch(err => console.warn('Could not load orders from server, using local.', err));

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
    // Fetch real settings from Express server
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
        }
      })
      .catch(err => console.warn('Could not load settings from server, using default.', err));

    if (savedCoupons) {
      try {
        setCoupons(JSON.parse(savedCoupons));
      } catch (e) {
        setCoupons(SEED_COUPONS);
      }
    } else {
      setCoupons(SEED_COUPONS);
      localStorage.setItem('ad_print_3d_coupons', JSON.stringify(SEED_COUPONS));
    }
  }, []);

  // Update active product's default color when selection changes
  useEffect(() => {
    if (activeProduct) {
      const baseColorName = activeProduct.baseColor || 'Roxo Galáxia';
      const matchingColor = FILAMENT_COLORS.find(c => c.name === baseColorName) || FILAMENT_COLORS[0];
      setSelectedColor(matchingColor);
      setSelectedSecondaryColor(FILAMENT_COLORS.find(c => c.name === 'Preto Carbono') || FILAMENT_COLORS[1]);
      setCustomText('');
    }
  }, [activeProduct]);

  // Database operations
  const updateProductsInDb = (updatedList: Product[]) => {
    setProducts(updatedList);
    try {
      localStorage.setItem('ad_print_3d_products', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
  };

  useProductImageCleaner(products, updateProductsInDb);

  const updateOrdersInDb = (updatedList: Order[]) => {
    setOrders(updatedList);
    try {
      localStorage.setItem('ad_print_3d_orders', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminAddCoupon = (newCoupon: Coupon) => {
    const updated = [...coupons, newCoupon];
    setCoupons(updated);
    localStorage.setItem('ad_print_3d_coupons', JSON.stringify(updated));
  };

  const handleAdminDeleteCoupon = (couponCodeId: string) => {
    const updated = coupons.filter(c => c.id !== couponCodeId);
    setCoupons(updated);
    localStorage.setItem('ad_print_3d_coupons', JSON.stringify(updated));
  };

  const updateCartInDb = (updatedCart: OrderItem[]) => {
    setCart(updatedCart);
    try {
      localStorage.setItem('ad_print_3d_cart', JSON.stringify(updatedCart));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSettings = (updatedSettings: ECommerceSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('ad_print_3d_settings', JSON.stringify(updatedSettings));

    // Save settings to backend
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings)
    }).catch(err => console.error('Erro ao salvar configurações no servidor:', err));
  };

  // Cart operations
  const handleAddToCart = (product: Product, chosenColor?: string) => {
    const finalColor = chosenColor || product.baseColor || 'Roxo Galáxia';
    const finalItemName = `${product.name} (${finalColor} | M | Giroide 15% | 0.20mm)`;
    const cartItemId = `${product.id}-${finalColor}-M-Giroide-15-0.20mm`;

    const existingIndex = cart.findIndex(item => item.productId === cartItemId);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updateCartInDb(updated);
    } else {
      updateCartInDb([...cart, { 
        productId: cartItemId, 
        name: finalItemName, 
        price: product.price, 
        quantity: 1,
        selectedColor: finalColor
      }]);
    }
    setIsCartOpen(true);
  };

  // Custom configuration addition to cart
  const handleAddCustomProductToCart = (
    product: Product,
    color: string,
    size: 'P' | 'M' | 'G' | 'GG',
    finalPrice: number,
    chosenSecondaryColor?: string,
    chosenText?: string
  ) => {
    const isPersonalizado = ['letreiro-personalizado', 'porta-lapis-personalizado'].includes(product.id);
    const secColor = chosenSecondaryColor || (isPersonalizado ? selectedSecondaryColor.name : undefined);
    const textVal = chosenText || (isPersonalizado ? customText : undefined);

    let customName = `${product.name} (${color} | Tam: ${size})`;
    let cartItemId = `${product.id}-${color}-${size}`;

    if (isPersonalizado) {
      const displaySecColor = secColor || 'Preto Carbono';
      const displayText = textVal ? `Texto: "${textVal}"` : 'Sem texto';
      customName = `${product.name} (${color} / ${displaySecColor} | ${displayText} | Tam: ${size})`;
      cartItemId = `${product.id}-${color}-${displaySecColor}-${textVal || 'none'}-${size}`;
    }
    
    const existingIndex = cart.findIndex(item => item.productId === cartItemId);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updateCartInDb(updated);
    } else {
      updateCartInDb([...cart, {
        productId: cartItemId,
        name: customName,
        price: finalPrice,
        quantity: 1,
        selectedColor: color
      }]);
    }
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number, isBox?: boolean) => {
    const index = cart.findIndex(item => item.productId === productId && (!isBox || item.isBox));
    if (index > -1) {
      const updated = [...cart];
      if (delta === -1 && updated[index].quantity === 1) {
        updated.splice(index, 1);
      } else {
        updated[index].quantity += delta;
      }
      updateCartInDb(updated);
    }
  };

  const handleRemoveFromCart = (productId: string, isBox?: boolean) => {
    const updated = cart.filter(item => !(item.productId === productId && (!isBox || item.isBox)));
    updateCartInDb(updated);
  };

  const handleAddCustomBoxToCart = (items: Product[], originalTotal: number, finalTotal: number) => {
    const boxItemNames = items.map(it => it.name);
    const boxId = 'custom-box-' + Date.now();
    const newBoxCartItem: OrderItem = {
      productId: boxId,
      name: `Box Sensorial Customizada (${items.length} itens)`,
      price: finalTotal,
      quantity: 1,
      isBox: true,
      boxItems: boxItemNames
    };
    updateCartInDb([...cart, newBoxCartItem]);
  };

  // Admin DB operations handlers
  const handleAdminAddProduct = (newProd: Product) => {
    updateProductsInDb([newProd, ...products]);
  };

  const handleAdminUpdateProduct = (updatedProd: Product) => {
    const updated = products.map(p => p.id === updatedProd.id ? updatedProd : p);
    updateProductsInDb(updated);
  };

  const handleAdminUpdateStock = (id: string, newStock: number) => {
    const updated = products.map(p => p.id === id ? { ...p, stock: newStock } : p);
    updateProductsInDb(updated);
  };

  const handleAdminDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    updateProductsInDb(updated);
  };

  const handleAdminUpdateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, orderStatus: status } : o);
    setOrders(updated);

    // Save order status update to Express backend
    fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(err => console.error('Erro ao atualizar status no servidor:', err));
  };

  // Checkout submit handler
  const handleCheckoutSubmitOrder = (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    // Reload orders from Express server to reflect new order
    setTimeout(() => {
      fetch('/api/admin/orders')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data);
          }
        });
    }, 1000);

    updateCartInDb([]); // wipe cart
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = 0;
  const hasShippingBonus = cartSubtotal >= settings.freeShippingThreshold || cart.some(item => item.isBox || item.productId.startsWith('kit-aconchego-box') || item.productId.startsWith('kit-dino-box'));
  const shippingCost = cartItemsCount > 0 && !hasShippingBonus ? 14.90 : 0;
  const cartFinalTotal = cartSubtotal - discountAmount + shippingCost;

  // Selected Category filter
  const filteredHomeProducts = selectedCategory === 'Todos'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Active Product calculations
  const activeProductVal = activeProduct || products[0] || INITIAL_PRODUCTS[0];

  // Simulator values based on Active Product
  const getProductSpecs = (id: string) => {
    switch (id) {
      case 'dino-artic':
        return { file: 't_rex_artic.stl', time: '3h 45m', mass: '78g', layers: 560 };
      case 'nexo-cube':
        return { file: 'cubo_engrenagens_infinitas.stl', time: '2h 0m', mass: '42g', layers: 320 };
      case 'pulse-pad':
        return { file: 'click_fidget_pulse_pad.stl', time: '1h 10m', mass: '35g', layers: 240 };
      case 'estrela-espiral-movel':
        return { file: 'estrela_cinetica_espiral.stl', time: '2h 15m', mass: '48g', layers: 360 };
      default:
        return { file: `${id}_calibrado.stl`, time: '2h 30m', mass: '45g', layers: 350 };
    }
  };
  const activeSpecs = getProductSpecs(activeProductVal.id);

  // Price calculations based on customizer
  const getSizeFactor = (size: 'P' | 'M' | 'G') => {
    switch (size) {
      case 'P': return 0.8;
      case 'G': return 1.3;
      case 'M':
      default:
        return 1.0;
    }
  };
  const isSilkColor = selectedColor.category === 'Silk';
  const calculatedCustomPrice = (activeProductVal.price * getSizeFactor(selectedSize)) + (isSilkColor ? 10.00 : 0);

  // Filter swatches based on filament category filter tab
  const filteredColors = filamentTab === 'Ver Todos'
    ? FILAMENT_COLORS
    : FILAMENT_COLORS.filter(c => c.category === filamentTab);

  // Product categories mapped to emoji tags
  const getProductTag = (category: string) => {
    switch (category) {
      case 'Articulados': return 'Satisfatório';
      case 'Fidgets': return 'Estalado';
      case 'Sensoriais': return 'Silencioso';
      case 'Kits': return 'Suave';
      default: return 'Suave';
    }
  };

  const getAcousticSpec = (category: string) => {
    switch (category) {
      case 'Articulados':
        return { tag: 'SATISFATÓRIO', color: 'bg-[#fbbf24]', text: 'Este brinquedo emite um som classificado como chocalho mecânico tátil ao ser manipulado. Excelente para estimulação tátil repetitiva de impacto médio.' };
      case 'Sensoriais':
        return { tag: 'SILENCIOSO', color: 'bg-[#4ade80]', text: 'Este brinquedo emite um som classificado como Suave. É ideal para ambientes escolares e corporativos pois possui eixos concêntricos lubrificados silenciosos.' };
      case 'Fidgets':
        return { tag: 'ESTALADO', color: 'bg-[#ec4899]', text: 'Estalos secos e de alta frequência. Estimula o relaxamento rápido através de feedback de áudio tátil de alta fidelidade.' };
      default:
        return { tag: 'SUAVE', color: 'bg-[#fbbf24]', text: 'Livre de atrito excessivo. Design ergonômico ideal para autorregulação tátil em consultórios e terapias ocupacionais.' };
    }
  };
  const acousticInfo = getAcousticSpec(activeProductVal.category);

  // Add Comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;
    const rightNow = new Date();
    const formattedDate = rightNow.toLocaleDateString('pt-BR');

    const newComment = {
      name: commentName.toUpperCase(),
      rating: commentRating,
      text: commentText,
      date: formattedDate
    };

    const currentProductComments = productComments[activeProductVal.id] || [];
    setProductComments({
      ...productComments,
      [activeProductVal.id]: [newComment, ...currentProductComments]
    });

    setCommentName('');
    setCommentText('');
  };

  const currentProductReviews = productComments[activeProductVal.id] || [
    { name: 'ANTONIO LOPES', rating: 5, text: 'Excelente acabamento e toque. A precisão do fatiamento 3D realmente é notável.', date: '10/05/2026' }
  ];

  return (
    <div className="min-h-screen bg-[#faf6e8] text-black flex flex-col font-sans">
      
      {/* Top promotional Announcement Bar */}
      <div className="bg-black py-2 px-4 text-center text-[10px] font-black tracking-widest text-[#fcd34d] uppercase shrink-0 border-b-[2.5px] border-black">
        🚀 FRETE GRÁTIS EM KITS OU COMPRAS ACIMA DE {settings.freeShippingThreshold.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}! PAGAMENTO VIA PIX OU CARTÃO
      </div>

      {/* Main Navbar */}
      <Navbar 
        currentTab={currentTab} 
        setTab={(tab) => {
          setTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        isAdmin={true}
      />

      {/* Dynamic Tab Body */}
      <main className="flex-grow pb-16">
        
        {settings.maintenanceMode && settings.maintenanceMode.startsWith('Sim') && currentTab !== 'admin' ? (
          <div className="py-20 px-4 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
            <span className="text-5xl animate-bounce mb-6">🛠️</span>
            <h2 className="font-sans font-black text-2xl text-slate-900 uppercase tracking-tight">AD PRINT 3D</h2>
            <span className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-2.5">
              Portal em Manutenção Programada
            </span>
            <p className="text-slate-600 text-xs mt-4 leading-relaxed font-semibold">
              Estamos calibrando nossas impressoras 3D e atualizando o estoque com novos brinquedos articulados e kits sensoriais. Retornaremos em instantes!
            </p>
            <div className="mt-8 p-4 bg-slate-50 border border-slate-150 rounded-2xl w-full text-left space-y-2">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Fale Conosco:</span>
              <a 
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-750 hover:text-teal-850 transition-colors"
                id="maintenance-whastapp-btn"
              >
                <span>💬</span> Atendimento via WhatsApp Comercial
              </a>
            </div>
            
            <button 
              id="secret-admin-portal"
              onClick={() => setTab('admin')}
              className="mt-16 text-[9px] font-mono text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors cursor-pointer"
            >
              Acesso Restrito Administração
            </button>
          </div>
        ) : (
          <>
            {/* TAB 1: SHOPSTORE HOME */}
            {currentTab === 'shoppe' && (
              <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
                
                {/* HERO BRAND BANNER */}
                <section className="bg-white border-3 border-black rounded-3xl p-6 sm:p-10 shadow-[4px_4px_0px_#000] relative overflow-hidden mb-12">
                  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4ade80]/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 right-10 w-72 h-72 bg-[#fcd34d]/10 rounded-full blur-[80px] pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Text Block content */}
                    <div className="lg:col-span-8 space-y-5 text-left">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fcd34d] border-2 border-black px-4 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
                        <Zap className="w-3.5 h-3.5 text-black" /> ENGENHARIA SENSORIAL &amp; IMPRESSÃO 3D
                      </div>
                      
                      <h1 className="font-display text-3xl sm:text-5xl lg:text-[44px] font-black tracking-tight text-black leading-tight uppercase">
                        SINTA A FÍSICA DO GIRO. <br />
                        CONFIGURE O SEU <span className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent underline decoration-black decoration-wavy">FIDGET 3D</span>
                      </h1>
                      
                      <p className="text-slate-700 text-xs sm:text-sm max-w-2xl leading-relaxed font-semibold">
                        Nossos brinquedos são projetados especificamente para regulação neurodivergente (TDAH, TEA, ansiedade). Explore o fatiador profissional abaixo para ajustar materiais, pesos e densidades direto nas nossas impressoras.
                      </p>
                    </div>

                    {/* Right features pill info */}
                    <div className="lg:col-span-4 flex flex-col gap-2 bg-[#faf6e8] border-2 border-black p-4 rounded-2xl shadow-[2px_2px_0px_#000]">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌿</span>
                        <div className="text-left"><span className="block text-[10px] font-black text-black uppercase">PLA Atóxico</span><span className="text-[9px] font-bold text-slate-500">Biodegradável Seguro</span></div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-black/10 pt-2">
                        <span className="text-xl">🪐</span>
                        <div className="text-left"><span className="block text-[10px] font-black text-black uppercase">Toque Tátil</span><span className="text-[9px] font-bold text-slate-500">Sensório-Proprioceptivo</span></div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-black/10 pt-2">
                        <span className="text-xl">🤫</span>
                        <div className="text-left"><span className="block text-[10px] font-black text-black uppercase">Silenciosos</span><span className="text-[9px] font-bold text-slate-500">Discretos na Sala de Aula</span></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* FILTERS AND TITLE ROW */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex flex-wrap gap-2.5">
                    {([
                      { label: 'VER TODOS 🔍', value: 'Todos' },
                      { label: 'COLEÇÃO ARTICULADA 🐉', value: 'Articulados' },
                      { label: 'GIRO & CINÉTICOS 🌀', value: 'Sensoriais' },
                      { label: 'TEXTURAS & FIDGETS 🧩', value: 'Fidgets' },
                      { label: 'DECORAÇÃO & CUSTOMIZADOS 🏷️', value: 'Personalizados' }
                    ] as const).map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedCategory(filter.value)}
                        className={`px-4 py-2.5 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000] flex items-center gap-1.5 ${
                          selectedCategory === filter.value
                            ? 'bg-[#3b82f6] text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-white text-black hover:bg-slate-50'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3-COLUMN DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                  
                  {/* COLUMN 1: ESCOLHA O MODELO */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex justify-between items-baseline border-b border-black pb-2">
                      <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">1. Escolha o Modelo</h3>
                      <span className="text-[10px] font-black text-slate-500 uppercase">{filteredHomeProducts.length} brinquedos disponíveis</span>
                    </div>

                    <div className="max-h-[580px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                      {filteredHomeProducts.map((prod) => {
                        const isSelected = activeProductVal.id === prod.id;
                        return (
                          <div
                            key={prod.id}
                            onClick={() => setActiveProduct(prod)}
                            className={`flex gap-3 bg-white border-2 border-black rounded-2xl p-3 text-left shadow-[3px_3px_0px_#000] hover:border-black transition-all cursor-pointer relative active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000] ${
                              isSelected ? 'bg-amber-50/50 ring-3 ring-black/40' : ''
                            }`}
                          >
                            {/* Product Thumbnail */}
                            <div className="w-20 h-20 bg-white border-2 border-black rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                              {/* Overlay Category Tag */}
                              <span className="absolute top-1 left-1 bg-[#a855f7] text-white text-[7.5px] font-black px-1 py-0.5 rounded leading-none uppercase">
                                {getProductTag(prod.category)}
                              </span>

                              {/* Render Visual Placeholder or Image */}
                              {prod.imageUrl === 'pulse-pad' || prod.imageUrl === 'nexo-cube' || prod.imageUrl === 'estrela-espiral' ? (
                                <span className="text-3xl select-none">
                                  {prod.imageUrl === 'pulse-pad' ? '🔳' : prod.imageUrl === 'nexo-cube' ? '♾️' : '🌀'}
                                </span>
                              ) : prod.imageUrl && (prod.imageUrl.startsWith('http') || prod.imageUrl.startsWith('/') || prod.imageUrl.startsWith('data:')) ? (
                                <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-3xl">{prod.imageUrl || '📦'}</span>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-grow flex flex-col justify-between">
                              <div>
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                  {prod.category}
                                </span>
                                <h4 className="text-xs font-black text-black leading-snug line-clamp-1 mt-0.5">
                                  {prod.name}
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
                                  {prod.description}
                                </p>
                              </div>
                              <div className="flex justify-between items-end mt-1.5">
                                <span className="text-xs font-black text-black">
                                  R$ {prod.price.toFixed(2)}
                                </span>
                                <span className="bg-[#fcd34d] border border-black rounded px-1.5 py-0.5 text-[8.5px] font-black text-black leading-none flex items-center gap-0.5 shadow-[1px_1px_0px_#000]">
                                  ⭐ 4.9
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLUMN 2: SIMULADOR INTERATIVO */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-black pb-2">
                      <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">2. Simulador Interativo</h3>
                      <div className="flex gap-1.5">
                        <span className="bg-[#4ade80] border border-black px-2 py-0.5 rounded-full text-[9px] font-black text-black leading-none shadow-[1px_1px_0px_#000]">Giro: ATIVO</span>
                        <span className="bg-[#fcd34d] border border-black px-2 py-0.5 rounded-full text-[9px] font-black text-black leading-none shadow-[1px_1px_0px_#000]">Testar Feedback Tátil</span>
                      </div>
                    </div>

                    <div className="bg-[#1c1c1c] border-3 border-black rounded-3xl p-5 shadow-[4px_4px_0px_#000] text-white">
                      
                      {/* Printer Head Status bar */}
                      <div className="flex justify-between items-start text-[9px] font-mono mb-4 border-b border-white/10 pb-2">
                        <div className="text-left">
                          <span className="block text-[8px] text-slate-400 uppercase font-black">ESTÚDIO DE CRIAÇÃO</span>
                          <span className="text-slate-300 block font-bold mt-0.5">AD PRINT 3D LAB</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] text-[#4ade80] font-black tracking-wider">PRONTO PARA IMPRESSÃO</span>
                          <span className="text-[#4ade80] font-bold mt-0.5 block">Configuração Personalizada</span>
                        </div>
                      </div>

                      {/* Interactive window center frame */}
                      <div className="bg-[#111111] border-2 border-black rounded-2xl h-56 relative flex items-center justify-center p-3 overflow-hidden bg-[radial-gradient(#2d2d2d_1.5px,transparent_1.5px)] [background-size:16px_16px]">
                        
                        {/* Glowing square background container */}
                        <div className="absolute inset-4 border-2 border-dashed border-white/20 bg-white/[0.03] rounded-2xl pointer-events-none flex items-center justify-center" />

                        {/* Visualizer selector */}
                        {activeProductVal.imageUrl === 'pulse-pad' ? (
                          <PulsePadInteractive color={selectedColor} />
                        ) : activeProductVal.imageUrl === 'nexo-cube' ? (
                          <NexoCubeInteractive color={selectedColor} />
                        ) : activeProductVal.imageUrl === 'estrela-espiral' ? (
                          <EstrelaEspiralInteractive color={selectedColor} />
                        ) : (
                          // Fallback styled visualizer for default products
                          <div className="absolute inset-4 rounded-2xl overflow-hidden flex items-center justify-center">
                            <div 
                              className="select-none w-full h-full transition-all duration-300 flex items-center justify-center relative"
                              style={{ 
                                filter: `drop-shadow(0 0 15px ${selectedColor.hex}40)`,
                                transform: `scale(${getSizeFactor(selectedSize)})`
                              }}
                            >
                              {activeProductVal.imageUrl && (activeProductVal.imageUrl.startsWith('http') || activeProductVal.imageUrl.startsWith('/') || activeProductVal.imageUrl.startsWith('data:')) ? (
                                <div className="relative w-full h-full hover:scale-105 transition-transform duration-300 cursor-zoom-in active:scale-110 flex items-center justify-center">
                                  <img 
                                    src={activeProductVal.imageUrl} 
                                    alt={activeProductVal.name} 
                                    onClick={() => setIsSimulatorImageZoomed(true)}
                                    className="w-full h-full object-contain"
                                  />
                                  {!['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeProductVal.id) && (
                                    <div 
                                      onClick={() => setIsSimulatorImageZoomed(true)}
                                      className="absolute inset-0 w-full h-full pointer-events-none"
                                      style={{
                                        backgroundColor: selectedColor.hex,
                                        mixBlendMode: 'color',
                                        maskImage: `url(${activeProductVal.imageUrl})`,
                                        WebkitMaskImage: `url(${activeProductVal.imageUrl})`,
                                        maskSize: 'contain',
                                        WebkitMaskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                        WebkitMaskPosition: 'center',
                                      }}
                                    />
                                  )}
                                  {activeProductVal.id === 'letreiro-personalizado' && customText && (
                                    <div 
                                      className="absolute bottom-[36px] left-1/2 -translate-x-1/2 w-[90%] text-center font-display font-black text-[12px] uppercase tracking-wide pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] rotate-[-1.5deg]"
                                      style={{ color: selectedSecondaryColor.hex }}
                                    >
                                      {customText}
                                    </div>
                                  )}
                                  {activeProductVal.id === 'porta-lapis-personalizado' && customText && (
                                    <div 
                                      className="absolute bottom-[24px] left-1/2 -translate-x-1/2 w-[80%] text-center font-display font-black text-[10px] uppercase tracking-wide pointer-events-none select-none drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)]"
                                      style={{ color: selectedSecondaryColor.hex }}
                                    >
                                      {customText}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span 
                                  onClick={() => setIsSimulatorImageZoomed(true)}
                                  className="text-7xl cursor-pointer hover:scale-125 transition-transform duration-300 block"
                                  style={{ color: selectedColor.hex }}
                                >
                                  {activeProductVal.imageUrl || '📦'}
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/85 border border-slate-800 px-3 py-1 text-[8px] font-mono font-bold text-teal-400 uppercase tracking-widest shadow-md z-10 pointer-events-none whitespace-nowrap">
                              Estúdio 3D: {selectedColor.name}
                              {['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeProductVal.id) && ` / ${selectedSecondaryColor.name}`}
                              {` (${selectedSize})`}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Material info row */}
                      <div className="mt-3 flex justify-between text-[9px] font-mono text-slate-400 font-bold">
                        <span>Material: Plástico PLA Ecológico</span>
                        <span>100% Seguro &amp; Atóxico</span>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 3: CUSTOMIZAR ATRIBUTOS */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-black pb-2">
                      <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">3. Customizar Atributos</h3>
                      <span className="bg-[#fcd34d] border border-black px-2.5 py-0.5 rounded-full text-[9px] font-black text-black leading-none shadow-[1px_1px_0px_#000]">PRO SETUP</span>
                    </div>

                    <div className="bg-white border-3 border-black rounded-3xl p-5 shadow-[4px_4px_0px_#000] text-black space-y-5">
                      
                      {/* Filament Color Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Cor do Filamento:</label>
                          <span className="text-[10px] font-black bg-[#fcd34d] border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]">{selectedColor.name}</span>
                        </div>

                        {/* Color Category Tabs */}
                        <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
                          {(['Ver Todos', 'Silk', 'Matte'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setFilamentTab(tab)}
                              className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors cursor-pointer ${
                                filamentTab === tab ? 'bg-black text-white' : 'text-slate-500 hover:text-black hover:bg-slate-50'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Swatches Grid */}
                        <div className="grid grid-cols-5 gap-2 pt-1.5">
                          {filteredColors.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => setSelectedColor(color)}
                              className={`w-9 h-9 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_#000] cursor-pointer flex items-center justify-center transition-all ${
                                selectedColor.name === color.name ? 'ring-3 ring-black/40 scale-105' : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            >
                              {selectedColor.name === color.name && (
                                <span className="text-[12px] font-black text-white bg-black/60 rounded-full h-5 w-5 flex items-center justify-center leading-none">✓</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Premium Filament Modifier Notice */}
                        {isSilkColor && (
                          <p className="text-[9px] text-[#f87171] font-black uppercase tracking-wide bg-[#fff1f2] border border-[#fecdd3] p-1.5 rounded-lg text-center animate-pulse">
                            + R$ 10.00 (FILAMENTO SILK)
                          </p>
                        )}
                      </div>

                      {/* Personalização Extras (Text & Secondary Color) */}
                      {['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeProductVal.id) && (
                        <div className="space-y-4 border-t border-b border-black/10 py-4 text-left">
                          {/* Text Input */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                              {activeProductVal.id === 'letreiro-personalizado' ? 'Texto do Letreiro:' : 'Nome no Bolso:'}
                            </label>
                            <input
                              type="text"
                              maxLength={activeProductVal.id === 'letreiro-personalizado' ? 25 : 12}
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              placeholder={activeProductVal.id === 'letreiro-personalizado' ? 'Ex: LOVE 3D' : 'Ex: ALEX'}
                              className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-black placeholder-slate-400 bg-slate-50 text-black"
                            />
                            <div className="flex justify-between text-[8px] font-bold text-slate-400">
                              <span>Máx: {activeProductVal.id === 'letreiro-personalizado' ? 25 : 12} letras</span>
                              <span>{customText.length}/{activeProductVal.id === 'letreiro-personalizado' ? 25 : 12}</span>
                            </div>
                          </div>

                          {/* Secondary Color Picker */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                {activeProductVal.id === 'letreiro-personalizado' ? 'Cor do Texto:' : 'Cor dos Detalhes/Cordão:'}
                              </label>
                              <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                                {selectedSecondaryColor.name}
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-2 pt-1">
                              {FILAMENT_COLORS.map((color) => (
                                <button
                                  key={color.name}
                                  onClick={() => setSelectedSecondaryColor(color)}
                                  className={`w-9 h-9 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center transition-all ${
                                    selectedSecondaryColor.name === color.name ? 'ring-3 ring-black/40 scale-105' : 'hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                >
                                  {selectedSecondaryColor.name === color.name && (
                                    <span className="text-[12px] font-black text-white bg-black/60 rounded-full h-5 w-5 flex items-center justify-center leading-none">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scale / Size selector */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Escala / Tamanho do Modelo:</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['P', 'M', 'G'] as const).map((size) => {
                            const sizeLabels = { P: '50%', M: '100%', G: '150%' };
                            const isActive = selectedSize === size;
                            return (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`py-1.5 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] flex flex-col items-center justify-center ${
                                  isActive ? 'bg-[#f87171] text-white shadow-[1px_1px_0px_#000]' : 'bg-white hover:bg-slate-50'
                                  }`}
                              >
                                <span>{size}</span>
                                <span className="text-[7.5px] opacity-75 font-normal">{sizeLabels[size]}</span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[8.5px] font-bold text-slate-500 uppercase text-center mt-1">
                          {selectedSize === 'P' ? 'Pequeno (Ideal para chaveiros)' : selectedSize === 'M' ? 'MÉDIO (SENSORIAL PADRÃO) (1X)' : 'Grande (Feedback físico ampliado)'}
                        </p>
                      </div>

                      {/* Add to Cart checkout Button */}
                      <button
                        onClick={() => handleAddCustomProductToCart(
                          activeProductVal,
                          selectedColor.name,
                          selectedSize,
                          calculatedCustomPrice,
                          ['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeProductVal.id) ? selectedSecondaryColor.name : undefined,
                          ['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeProductVal.id) ? customText : undefined
                        )}
                        className="w-full py-3.5 bg-[#4ade80] border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:bg-[#3ec473] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] cursor-pointer text-center text-black block transition-all"
                      >
                        Adicionar à Sacola - R$ {calculatedCustomPrice.toFixed(2)}
                      </button>

                    </div>
                  </div>

                </div>

                {/* PRODUCT DETAILS (SOBRE O MODELO) */}
                <section className="bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_#000] mb-12">
                  <div className="space-y-6 text-left">
                    <div>
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">VISÃO DETALHADA</span>
                      <h2 className="font-display font-black text-2xl text-black uppercase mt-1">
                        Sobre o {activeProductVal.name}
                      </h2>
                      <p className="text-slate-700 text-xs sm:text-sm mt-3 leading-relaxed font-semibold">
                        {activeProductVal.description}
                      </p>
                    </div>

                    {/* Acoustic & Print mechanism Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#faf6e8] border-2 border-black p-4 rounded-2xl shadow-[2px_2px_0px_#000]">
                        <h4 className="font-sans font-black text-xs text-black flex items-center gap-1.5">
                          🔊 FÍSICA DO SOM (ACÚSTICA)
                        </h4>
                        <p className="text-[11px] text-slate-700 font-semibold leading-relaxed mt-2">
                          {acousticInfo.text}
                        </p>
                        <span className={`inline-block border border-black ${acousticInfo.color} text-black text-[8px] font-black px-2 py-0.5 rounded uppercase mt-3 shadow-[1px_1px_0px_#000]`}>
                          Feedback Acústico: {acousticInfo.tag}
                        </span>
                      </div>

                      <div className="bg-[#faf6e8] border-2 border-black p-4 rounded-2xl shadow-[2px_2px_0px_#000]">
                        <h4 className="font-sans font-black text-xs text-black flex items-center gap-1.5">
                          ⚙️ MECÂNICA DE IMPRESSÃO
                        </h4>
                        <p className="text-[11px] text-slate-700 font-semibold leading-relaxed mt-2">
                          Fabricação complexa utilizando tecnologia de fatiamento tridimensional modular. Ligas flexíveis de alta densidade integradas no filamento termoplástico e juntas micrométricas para impedir emperramento.
                        </p>
                        <span className="inline-block border border-black bg-[#4ade80] text-black text-[8px] font-black px-2 py-0.5 rounded uppercase mt-3 shadow-[1px_1px_0px_#000]">
                          Complexidade: Mecanismo Modular Complexo
                        </span>
                      </div>
                    </div>

                    {/* Approved Sensory benefits */}
                    <div className="space-y-2 border-t border-black/10 pt-4">
                      <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">BENEFÍCIOS SENSORIAIS APROVADOS:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="border border-black bg-slate-50 p-2.5 rounded-xl flex items-start gap-2 shadow-[1px_1px_0px_#000]">
                          <span className="bg-[#fcd34d] border border-black rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                          <span className="text-[9.5px] font-bold text-slate-800 leading-snug">Fascinante visualização de mecânica de transmissão</span>
                        </div>
                        <div className="border border-black bg-slate-50 p-2.5 rounded-xl flex items-start gap-2 shadow-[1px_1px_0px_#000]">
                          <span className="bg-[#fcd34d] border border-black rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                          <span className="text-[9.5px] font-bold text-slate-800 leading-snug">Sensação incrível de resistência mecânica sob comando</span>
                        </div>
                        <div className="border border-black bg-slate-50 p-2.5 rounded-xl flex items-start gap-2 shadow-[1px_1px_0px_#000]">
                          <span className="bg-[#fcd34d] border border-black rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                          <span className="text-[9.5px] font-bold text-slate-800 leading-snug">Estimulação de raciocínio espacial e foco construtivo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* HIGHLIGHT FEATURES LIST */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white border-2 border-black border-l-[6px] border-l-blue-400 rounded-2xl p-5 text-left shadow-[3px_3px_0px_#000]">
                    <span className="text-2xl">👁️</span>
                    <h4 className="text-black font-black text-sm uppercase mt-2">1. Texturas Perfeitas</h4>
                    <p className="text-slate-650 text-xs leading-relaxed mt-2 font-medium">O processo de impressão 3D por deposição de filamento (FDM) cria microtexturas de camadas microscópicas que proporcionam um feedback sensorial contínuo.</p>
                  </div>
                  <div className="bg-white border-2 border-black border-l-[6px] border-l-yellow-400 rounded-2xl p-5 text-left shadow-[3px_3px_0px_#000]">
                    <span className="text-2xl">🎧</span>
                    <h4 className="text-black font-black text-sm uppercase mt-2">2. Feedback de Áudio</h4>
                    <p className="text-slate-650 text-xs leading-relaxed mt-2 font-medium">Diferente de brinquedos injetados ocos, os encaixes calibrados em 3D emitem cliques e estalidos de baixa frequência que estimulam o relaxamento como ASMR.</p>
                  </div>
                  <div className="bg-white border-2 border-black border-l-[6px] border-l-green-400 rounded-2xl p-5 text-left shadow-[3px_3px_0px_#000]">
                    <span className="text-2xl">🍀</span>
                    <h4 className="text-black font-black text-sm uppercase mt-2">3. PLA Biodegradável</h4>
                    <p className="text-slate-650 text-xs leading-relaxed mt-2 font-medium">Sustentabilidade em primeiro lugar. Utilizamos apenas filamentos de Ácido Polilático (PLA) de origem vegetal, livre de BPA, toxinas e seguro para morder.</p>
                  </div>
                </section>

                {/* CALIBRATION DIFFERENTIALS (⚡ NOSSOS DIFERENCIAIS DE CALIBRAÇÃO) */}
                <section className="bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_#000] text-left">
                  <h3 className="font-display font-black text-lg text-black flex items-center gap-1.5 uppercase mb-6">
                    ⚡ Nossos Diferenciais de Calibração
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border border-black p-4 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <h5 className="font-sans font-black text-xs text-red-500 uppercase leading-snug">Peça Única Articulada (Print-In-Place)</h5>
                      <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-2">
                        Nossas articuladoras de dragões e lagartas são impressas sem montagem manual. Isso reduz falhas catastróficas nas juntas e garante que o brinquedo não desmonte ou apresente riscos de asfixia.
                      </p>
                    </div>

                    <div className="border border-black p-4 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <h5 className="font-sans font-black text-xs text-green-600 uppercase leading-snug">Suporte para Neurodivergência</h5>
                      <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-2">
                        Brinquedos do tipo fidget ajudam a modular o estresse de autistas (TEA) e hiperativos (TDAH). Manter um estímulo tátil controlado ajuda mentes sobrecarregadas a focarem na tarefa principal.
                      </p>
                    </div>

                    <div className="border border-black p-4 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <h5 className="font-sans font-black text-xs text-blue-600 uppercase leading-snug">Curva de Giroide (Gyroid Infill)</h5>
                      <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-2">
                        Utilizamos o padrão tridimensional giroide para o preenchimento interno. Isso garante que as peças tenham ótima resistência física a tombos sem ficarem pesadas, além de propagar som uniforme.
                      </p>
                    </div>

                    <div className="border border-black p-4 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <h5 className="font-sans font-black text-xs text-yellow-600 uppercase leading-snug">Qualidade de Linha Polida</h5>
                      <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-2">
                        Nossas impressoras usam bicos de precisão controlados e calibração fina de avanço linear para garantir que as superfícies fiquem 100% livres de fiapos ásperos ou farpas cortantes de plástico.
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            )}

            {/* TAB 2: BOX BUILDER */}
            {currentTab === 'box-builder' && (
              <BoxBuilder 
                products={products} 
                onAddBoxToCart={handleAddCustomBoxToCart} 
              />
            )}

            {/* TAB 3: COMO FUNCIONA */}
            {currentTab === 'about' && (
              <div className="py-12 max-w-4xl mx-auto px-4 text-left">
                <span className="text-center block text-xs text-[#4ade80] font-sans font-black uppercase tracking-widest">
                  DÚVIDAS &amp; MANUAL DE APOIO SENSORIAL
                </span>
                <h2 className="text-center font-display text-3xl font-black text-black mt-3 uppercase tracking-tight">
                  Como Funciona a <span className="text-[#f87171]">AD PRINT 3D</span>?
                </h2>

                <div className="mt-10 space-y-6">
                  <div className="bg-white border-3 border-black p-6 rounded-3xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] transition-all shadow-[2px_2px_0px_#000]">
                    <h3 className="text-[#4ade80] font-sans font-black text-base uppercase">O que é PLA Atóxico e por que ele é seguro?</h3>
                    <p className="text-slate-700 text-xs leading-relaxed mt-2 font-semibold">
                      O poliácido láctico (PLA) é um termoplástico biodegradável de origem natural e atóxico. É produzido a partir de fontes de amido renováveis, como milho ou cana de açúcar. Não libera poeira tóxica, metais pesados ou BPA no contato repetido com a pele ou mucosa oral.
                    </p>
                  </div>

                  <div className="bg-white border-3 border-black p-6 rounded-3xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] transition-all shadow-[2px_2px_0px_#000]">
                    <h3 className="text-[#4ade80] font-sans font-black text-base uppercase">Qual a importância desses brinquedos para Autismo (TEA) e TDAH?</h3>
                    <p className="text-slate-700 text-xs leading-relaxed mt-2 font-semibold">
                      Pessoas neurodivergentes de todas as idades frequentemente necessitam de estímulos proprioceptivos ou vestibulares para regular seu excesso de energia tátil (stimming). Fidgets táteis oferecem uma válvula de escape segura e silenciosa que ajuda nas transições de tarefas de alta concentração e melhora a ansiedade.
                    </p>
                  </div>

                  <div className="bg-white border-3 border-black p-6 rounded-3xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] transition-all shadow-[2px_2px_0px_#000]">
                    <h3 className="text-[#f87171] font-sans font-black text-base uppercase flex items-center gap-1.5">Como funciona o Frete e a política de descontos da Box?</h3>
                    <p className="text-slate-700 text-xs leading-relaxed mt-2 font-semibold">
                      Nossa plataforma oferece suporte a combos especiais: comprando kits ou montando sua Box Sensorial com 5 ou mais brinquedos avulsos, você recebe <strong>30% de desconto definitivo</strong> e frete 100% grátis. Para outras compras normais, o frete possui custo fixo de R$14,90 (ou grátis acima do limite configurado de R$ 299,90).
                    </p>
                  </div>

                  <div className="bg-white border-3 border-black p-6 rounded-3xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] transition-all shadow-[2px_2px_0px_#000]">
                    <h3 className="text-[#4ade80] font-sans font-black text-base uppercase">Quais os canais de Suporte e Atendimento?</h3>
                    <p className="text-slate-700 text-xs leading-relaxed mt-2 font-semibold">
                      Temos suporte imediato via WhatsApp oficial e acompanhamento de rastreamento de impressora na aba "Rastrear". Encomendas corporativas para clínicas e escolas de educação inclusiva podem ser orçadas diretamente com nossa equipe técnica de modelagem.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TRACK ORDER SCREEN */}
            {currentTab === 'orders' && (
              <OrderTracker orders={orders} />
            )}

            {/* TAB 5: ADMIN DASHBOARD CONTROL PANEL */}
            {currentTab === 'admin' && (
              <AdminPanel 
                products={products}
                orders={orders}
                onAddProduct={handleAdminAddProduct}
                onUpdateProduct={handleAdminUpdateProduct}
                onUpdateProductStock={handleAdminUpdateStock}
                onDeleteProduct={handleAdminDeleteProduct}
                onUpdateOrderStatus={handleAdminUpdateOrderStatus}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                coupons={coupons}
                onAddCoupon={handleAdminAddCoupon}
                onDeleteCoupon={handleAdminDeleteCoupon}
              />
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t-3 border-black py-8 shrink-0 shadow-inner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-black text-xs">AD PRINT 3D</span>
            <span className="text-slate-400">• © 2026</span>
            {settings.pixKeyCode && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-[10px] font-sans font-black text-black bg-[#fcd34d] px-2.5 py-0.5 border border-black rounded-full uppercase shadow-[1.5px_1.5px_0px_#000]">
                  {settings.pixKeyType}: {settings.pixKeyCode}
                </span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center font-bold">
            <button onClick={() => setTab('about')} className="hover:text-black transition-colors uppercase text-[10px] tracking-wider font-black">Perguntas Frequentes</button>
            <span className="text-slate-350">•</span>
            <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#4ade80] flex items-center gap-1 transition-colors uppercase text-[10px] tracking-wider font-black">
              WhatsApp Suporte <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* FLOATING CART SLIDE DRAWER COMPONENT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
          
          <div 
            id="shopping-cart-drawer"
            className="relative h-full w-full max-w-md bg-white border-l-4 border-black shadow-2xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                <h3 className="font-display font-black text-black text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-black" />
                  Seu Carrinho ({cartItemsCount})
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-black transition-colors cursor-pointer"
                  id="close-cart-drawer-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List Items scroll container */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-3">🧺</span>
                    <p className="text-black text-xs font-black uppercase tracking-wider">Como num passe de mágica...</p>
                    <p className="text-slate-400 text-xs mt-1">Seu carrinho está vazio.</p>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        setTab('shoppe');
                      }}
                      className="text-xs text-[#f87171] hover:underline font-black mt-3 uppercase tracking-wider"
                    >
                      Ver os brinquedos agora
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 justify-between bg-[#faf6e8]/40 p-4 rounded-2xl border-2 border-black shadow-[2.5px_2.5px_0px_#000] hover:border-black transition-all">
                      <div className="flex-grow">
                        <h4 className="text-black text-xs font-black leading-snug">{item.name}</h4>
                        <span className="font-sans text-[11px] text-slate-700 mt-1 block font-extrabold">
                          R$ {item.price.toFixed(2)}
                        </span>
                        
                        {item.isBox && item.boxItems && (
                          <div className="mt-1.5 pt-1.5 border-t border-black/10">
                            <span className="text-[9.5px] font-sans font-black text-slate-400 uppercase block leading-none">Produtos na Box:</span>
                            <span className="text-[10px] text-[#f87171] font-black leading-tight block mt-0.5">{item.boxItems.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-between shrink-0">
                        <button
                          onClick={() => handleRemoveFromCart(item.productId, item.isBox)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remover do carrinho"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1.5 bg-white border-2 border-black px-2 py-1 rounded-xl shadow-[1px_1px_0px_#000]">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.productId, -1, item.isBox)}
                            className="text-slate-400 hover:text-black p-0.5 h-4 w-4 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-sans font-extrabold text-xs text-black min-w-3 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.productId, 1, item.isBox)}
                            className="text-slate-400 hover:text-black p-0.5 h-4 w-4 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom summary and checkouts CTA */}
            {cart.length > 0 && (
              <div className="border-t-2 border-black pt-4 mt-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Subtotal:</span>
                    <span className="text-black font-extrabold">R$ {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Custo de Envio:</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-emerald-700 font-black uppercase bg-[#eefcf3] border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] shadow-[1px_1px_0px_#000]">Grátis 🎉</span>
                      ) : (
                        `R$ ${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {!hasShippingBonus && (
                    <p className="text-[10px] text-slate-700 font-bold bg-[#faf6e8] border border-black/10 p-2 rounded-lg text-left">
                      💡 Adicione mais R$ {(settings.freeShippingThreshold - cartSubtotal).toFixed(2)} para ganhar Frete Grátis!
                    </p>
                  )}
                </div>

                <div className="border-t border-black/10 pt-3 flex justify-between items-center">
                  <span className="font-display font-black text-black text-sm uppercase">Valor Final:</span>
                  <span className="font-sans text-black font-black text-2xl">
                    R$ {cartFinalTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  id="cart-drawer-checkout-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#f87171] border-2 border-black text-white font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] cursor-pointer"
                >
                  Confirmar e Finalizar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        cartTotal={cartSubtotal}
        discount={discountAmount}
        shipping={shippingCost}
        onSubmitOrder={handleCheckoutSubmitOrder}
        settings={settings}
        coupons={coupons}
      />

      {/* Lightbox / Zoom modal */}
      {isSimulatorImageZoomed && (
        <div 
          onClick={() => setIsSimulatorImageZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg max-h-[85vh] flex flex-col items-center justify-center bg-[#faf6e8] border-3 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#000]"
          >
            <button 
              onClick={() => setIsSimulatorImageZoomed(false)}
              className="absolute -top-3 -right-3 bg-white border-2 border-black rounded-full p-1.5 hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_#000] hover:scale-110 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer z-10"
            >
              <X className="w-4 h-4 text-black" />
            </button>
            {activeProductVal.imageUrl && (activeProductVal.imageUrl.startsWith('http') || activeProductVal.imageUrl.startsWith('/') || activeProductVal.imageUrl.startsWith('data:')) ? (
              <div className="relative max-w-full max-h-[60vh] rounded-2xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000] flex items-center justify-center">
                <img 
                  src={activeProductVal.imageUrl} 
                  alt={activeProductVal.name} 
                  className="max-w-full max-h-[55vh] object-contain" 
                />
                {!['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeProductVal.id) && (
                  <div 
                    className="absolute inset-3 pointer-events-none"
                    style={{
                      backgroundColor: selectedColor.hex,
                      mixBlendMode: 'color',
                      maskImage: `url(${activeProductVal.imageUrl})`,
                      WebkitMaskImage: `url(${activeProductVal.imageUrl})`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                    }}
                  />
                )}
                {activeProductVal.id === 'letreiro-personalizado' && customText && (
                  <div 
                    className="absolute bottom-[32px] left-1/2 -translate-x-1/2 w-[90%] text-center font-display font-black text-xs uppercase tracking-wide pointer-events-none select-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] rotate-[-1.5deg]"
                    style={{ color: selectedSecondaryColor.hex }}
                  >
                    {customText}
                  </div>
                )}
                {activeProductVal.id === 'porta-lapis-personalizado' && customText && (
                  <div 
                    className="absolute bottom-[24px] left-1/2 -translate-x-1/2 w-[80%] text-center font-display font-black text-[10px] uppercase tracking-wide pointer-events-none select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]"
                    style={{ color: selectedSecondaryColor.hex }}
                  >
                    {customText}
                  </div>
                )}
              </div>
            ) : (
              <span 
                className="text-9xl"
                style={{ color: selectedColor.hex }}
              >
                {activeProductVal.imageUrl || '📦'}
              </span>
            )}
            <h4 className="mt-4 font-display font-black text-sm text-black uppercase tracking-wide text-center">
              {activeProductVal.name}
            </h4>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-1">
              Estúdio 3D: {selectedColor.name} ({selectedSize})
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
