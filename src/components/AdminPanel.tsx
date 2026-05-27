/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, ECommerceSettings, Coupon } from '../types';
import { cleanPngCheckersAndSetWhite } from '../utils/imageCleaner';
import AIGeneratorStudio from './admin/AIGeneratorStudio';
import { 
  DollarSign, Package, AlertTriangle, PlusCircle, Trash, RefreshCw, 
  Search, ShieldAlert, Heart, TrendingUp, Layers, Check, ShoppingBag, Edit, Settings,
  Tag, Gift, Percent, X, Sparkles
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onUpdateProductStock: (id: string, newStock: number) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (id: string, nextStatus: Order['orderStatus']) => void;
  settings: ECommerceSettings;
  onUpdateSettings: (newSettings: ECommerceSettings) => void;
  coupons: Coupon[];
  onAddCoupon: (newCoupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onLogout?: () => void;
}

export default function AdminPanel({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onUpdateProductStock,
  onDeleteProduct,
  onUpdateOrderStatus,
  settings,
  onUpdateSettings,
  coupons = [],
  onAddCoupon,
  onDeleteCoupon,
  onLogout
}: AdminPanelProps) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'stats' | 'products' | 'orders' | 'coupons' | 'configs' | 'ai-generator'>('stats');


  // Local state for system parameters editing form draft
  const [sysVars, setSysVars] = useState<ECommerceSettings>(settings);

  // Sync draft if prop changes
  useEffect(() => {
    setSysVars(settings);
  }, [settings]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Popup / Modal visibility states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'product' | 'coupon' } | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form states for creating a new coupon
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minSubtotal: '0'
  });

  // Edit / Register state manager
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageMode, setImageMode] = useState<'emoji' | 'url' | 'upload'>('emoji');

  // Form states for creating a new product
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Fidgets' as Product['category'],
    imageUrl: '🦕',
    stock: '20',
    size: '12cm',
    material: 'PLA Biodegradável Atóxico',
    baseColor: 'Roxo Galáxia' as Product['baseColor']
  });

  // Calculate admin stats
  const totalSales = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingShipments = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'preparing').length;
  const lowStockProducts = products.filter(p => p.stock <= 10);

  // Filter products for admin search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter orders for admin query
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to detect initial image mode for edit mode pre-fill
  const getInitialImageMode = (url: string) => {
    if (!url) return 'emoji';
    if (url.startsWith('data:image/')) return 'upload';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'url';
    return 'emoji';
  };

  // Start editing product and scroll to top form
  const handleStartEdit = (prod: Product) => {
    setEditingProduct(prod);
    setImageMode(getInitialImageMode(prod.imageUrl));
    setNewProductForm({
      name: prod.name,
      price: prod.price.toString(),
      description: prod.description,
      category: prod.category,
      imageUrl: prod.imageUrl,
      stock: prod.stock.toString(),
      size: prod.size,
      material: prod.material,
      baseColor: prod.baseColor || 'Roxo Galáxia'
    });
    setIsProductModalOpen(true);
  };

  // Cancel edit state and reset form
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setImageMode('emoji');
    setNewProductForm({
      name: '',
      price: '',
      description: '',
      category: 'Fidgets',
      imageUrl: '🦕',
      stock: '20',
      size: '12cm',
      material: 'PLA Biodegradável Atóxico',
      baseColor: 'Roxo Galáxia'
    });
    setIsProductModalOpen(false);
  };


  // Image upload to Base64 handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const cleanedString = await cleanPngCheckersAndSetWhite(base64String);
          setNewProductForm(prev => ({ ...prev, imageUrl: cleanedString }));
        } catch (err) {
          setNewProductForm(prev => ({ ...prev, imageUrl: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVariations = (imageUrl: string) => {
    if (!imageUrl || imageUrl === 'pulse-pad' || imageUrl === 'nexo-cube' || imageUrl === 'estrela-espiral' || imageUrl.length <= 4) {
      return undefined;
    }
    return [
      {
        url: imageUrl,
        cssFilter: 'contrast(1.05) saturate(1.1)',
        cssTransform: 'scale(1) rotate(0deg)'
      },
      {
        url: imageUrl,
        cssFilter: 'hue-rotate(120deg) saturate(1.25) contrast(1.1)',
        cssTransform: 'scale(1.05) rotate(15deg)'
      },
      {
        url: imageUrl,
        cssFilter: 'hue-rotate(240deg) saturate(1.3) contrast(1.15)',
        cssTransform: 'scale(1.1) rotate(-10deg) translateY(2%)'
      }
    ];
  };

  // Add or Edit Product form handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newProductForm.name || !newProductForm.price) {
        alert('Por favor, defina um nome e preço para o produto!');
        return;
      }

      const priceStr = String(newProductForm.price);
      const cleanedPrice = priceStr.replace(',', '.');
      const priceNum = parseFloat(cleanedPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        alert('Insira um preço de venda válido!');
        return;
      }

      const stockNum = parseInt(newProductForm.stock);
      const hasNewImage = editingProduct ? (editingProduct.imageUrl !== newProductForm.imageUrl) : true;

      if (editingProduct) {
        // Edit mode path
        const updatedProduct: Product = {
          ...editingProduct,
          name: newProductForm.name,
          price: priceNum,
          description: newProductForm.description || 'Produto sensorial feito sob demanda em nossa impressora 3D.',
          category: newProductFormFormCategory(newProductForm.category),
          imageUrl: newProductForm.imageUrl,
          aiImages: (hasNewImage || !editingProduct.aiImages || editingProduct.aiImages.length === 0)
            ? generateVariations(newProductForm.imageUrl)
            : editingProduct.aiImages,
          stock: isNaN(stockNum) ? 10 : stockNum,
          size: newProductForm.size || '10cm',
          material: newProductForm.material || 'PLA Atóxico',
          isKit: newProductForm.category === 'Kits',
          baseColor: newProductForm.baseColor
        };

        onUpdateProduct(updatedProduct);
        setEditingProduct(null);
        setImageMode('emoji');
        setIsProductModalOpen(false);
        alert('Produto atualizado com sucesso no catálogo!');
      } else {
        // Create mode path
        const generatedProduct: Product = {
          id: 'prod-' + Date.now(),
          name: newProductForm.name,
          price: priceNum,
          description: newProductForm.description || 'Produto sensorial feito sob demanda em nossa impressora 3D.',
          category: newProductFormFormCategory(newProductForm.category),
          imageUrl: newProductForm.imageUrl,
          aiImages: generateVariations(newProductForm.imageUrl),
          stock: isNaN(stockNum) ? 10 : stockNum,
          size: newProductForm.size || '10cm',
          material: newProductForm.material || 'PLA Atóxico',
          isKit: newProductForm.category === 'Kits',
          isPopular: false,
          baseColor: newProductForm.baseColor
        };

        onAddProduct(generatedProduct);
        setIsProductModalOpen(false);
        alert('Novo produto cadastrado com sucesso e adicionado ao inventário!');
      }
      
      // Reset form
      setNewProductForm({
        name: '',
        price: '',
        description: '',
        category: 'Fidgets',
        imageUrl: '🦕',
        stock: '20',
        size: '12cm',
        material: 'PLA Biodegradável Atóxico',
        baseColor: 'Roxo Galáxia'
      });
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Ocorreu um erro ao salvar o produto. Detalhes no console.');
    }
  };

  function newProductFormFormCategory(cat: string): Product['category'] {
    if (cat === 'Articulados' || cat === 'Sensoriais' || cat === 'Kits' || cat === 'Fidgets') {
      return cat;
    }
    return 'Fidgets';
  }

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponForm.code || !newCouponForm.value) {
      alert('Preencha o código do cupom e o valor do desconto!');
      return;
    }

    const valueNum = parseFloat(newCouponForm.value);
    if (isNaN(valueNum) || valueNum <= 0) {
      alert('Insira um valor de desconto válido!');
      return;
    }

    const minSubtotalNum = parseFloat(newCouponForm.minSubtotal) || 0;

    const newCoupon: Coupon = {
      id: 'coupon-' + Date.now(),
      code: newCouponForm.code.trim().toUpperCase(),
      type: newCouponForm.type,
      value: valueNum,
      minSubtotal: minSubtotalNum,
      isActive: true
    };

    onAddCoupon(newCoupon);
    setIsCouponModalOpen(false);
    alert(`Cupom ${newCoupon.code} criado com sucesso!`);

    setNewCouponForm({
      code: '',
      type: 'percentage',
      value: '',
      minSubtotal: '0'
    });
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(sysVars);
    setIsSettingsModalOpen(false);
    alert('Configurações salvas e aplicadas em tempo real em todas as seções da loja!');
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 text-left">
      {/* Title block */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fcd34d] border-2 border-black px-3 py-1 font-mono text-xs font-black text-black shadow-[1.5px_1.5px_0px_#000]">
            <ShieldAlert className="w-3.5 h-3.5 text-black" />
            CONEXÃO COM PAINEL AD INTERNO
          </span>
          <h2 className="mt-3 font-display font-black text-2xl text-black uppercase">
            Painel Administrativo <span className="text-[#f87171]">AD PRINT 3D</span>
          </h2>
          <p className="text-slate-700 text-xs mt-1.5 font-semibold">Gerencie produtos sensoriais, kits, estoque das impressoras e faturamento de vendas.</p>
        </div>

        {/* Botão de Sair */}
        {onLogout && (
          <button
            id="admin-logout-btn"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja sair do painel administrativo?')) {
                onLogout();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-100 shadow-[2px_2px_0px_#000] transition-all cursor-pointer shrink-0"
          >
            🔒 Sair
          </button>
        )}
        {/* Sub Navigation */}
        <div className="flex bg-white shadow-[3px_3px_0px_#000] border-2 border-black p-2 rounded-2xl shrink-0 flex-wrap gap-2 items-center relative overflow-hidden">
          <button
            id="admin-subtab-stats"
            onClick={() => setActiveAdminSubTab('stats')}
            className={`px-3 py-2 border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminSubTab === 'stats'
                ? 'bg-[#fcd34d] text-black shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white text-slate-500 hover:text-black'
            }`}
          >
            Visão Geral
          </button>
          <button
            id="admin-subtab-products"
            onClick={() => {
              setActiveAdminSubTab('products');
              setSearchQuery('');
            }}
            className={`px-3 py-2 border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminSubTab === 'products'
                ? 'bg-[#fcd34d] text-black shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white text-slate-500 hover:text-black'
            }`}
          >
            Inventário
          </button>
          <button
            id="admin-subtab-orders"
            onClick={() => {
              setActiveAdminSubTab('orders');
              setSearchQuery('');
            }}
            className={`px-3 py-2 border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminSubTab === 'orders'
                ? 'bg-[#fcd34d] text-black shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white text-slate-500 hover:text-black'
            }`}
          >
            Pedidos ({orders.length})
          </button>
          <button
            id="admin-subtab-coupons"
            onClick={() => {
              setActiveAdminSubTab('coupons');
              setSearchQuery('');
            }}
            className={`px-3 py-2 border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminSubTab === 'coupons'
                ? 'bg-[#fcd34d] text-black shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white text-slate-500 hover:text-black'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Cupons
          </button>
          <button
            id="admin-subtab-configs"
            onClick={() => {
              setActiveAdminSubTab('configs');
              setSearchQuery('');
            }}
            className={`px-3 py-2 border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminSubTab === 'configs'
                ? 'bg-[#fcd34d] text-black shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white text-slate-500 hover:text-black'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Variáveis do Site
          </button>
          <button
            id="admin-subtab-aigenerator"
            onClick={() => {
              setActiveAdminSubTab('ai-generator');
              setSearchQuery('');
            }}
            className={`px-3 py-2 border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminSubTab === 'ai-generator'
                ? 'bg-[#4ade80] text-black shadow-[1.5px_1.5px_0px_#000]'
                : 'bg-white text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gerador AD (IA)
          </button>
        </div>
      </div>

      {/* SEARCH BAR (For products & orders tabs) */}
      {activeAdminSubTab !== 'stats' && activeAdminSubTab !== 'configs' && activeAdminSubTab !== 'coupons' && activeAdminSubTab !== 'ai-generator' && (
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            id="admin-search-input"
            type="text"
            placeholder={activeAdminSubTab === 'products' ? "Buscar por brinquedo ou categoria..." : "Buscar por ID do pedido ou nome..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-teal-400 rounded-xl py-2 px-10 font-sans text-xs text-slate-900 placeholder-slate-600 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* DASHBOARD STATS VIEW */}
      {activeAdminSubTab === 'stats' && (
        <div className="space-y-8">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Faturamento (Confirmado)</span>
                <span className="font-mono text-2xl font-black text-emerald-400 mt-1 block">
                  R$ {totalSales.toFixed(2)}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                R$
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Total de Pedidos</span>
                <span className="font-mono text-2xl font-black text-slate-900 mt-1 block">
                  {orders.length}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center text-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Produção Pendente</span>
                <span className="font-mono text-2xl font-black text-amber-400 mt-1 block">
                  {pendingShipments}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Estoque Baixo (&lt; 15)</span>
                <span className={`font-mono text-2xl font-black mt-1 block ${lowStockProducts.length > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {lowStockProducts.length}
                </span>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg border ${
                lowStockProducts.length > 0 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-450'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Low stock alerts panel */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alerta de Linhas de Estoque
              </h3>
              
              {lowStockProducts.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">Tudo certo! Todas as peças 3D possuem filamento e estoque seguro.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {lowStockProducts.map(prod => (
                    <div key={prod.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0 h-8 w-8 bg-white border border-slate-200 rounded flex items-center justify-center p-0.5 overflow-hidden">
                          {prod.imageUrl && (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://') || prod.imageUrl.startsWith('/') || prod.imageUrl.startsWith('data:')) ? (
                            <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-contain rounded" referrerPolicy="no-referrer" />
                          ) : (
                            prod.imageUrl || '📦'
                          )}
                        </span>
                        <div>
                          <h4 className="text-slate-900 text-xs font-semibold leading-tight">{prod.name}</h4>
                          <span className="text-[10px] font-mono text-red-400 block mt-0.5 font-bold">Apenas {prod.stock} un. restantes</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onUpdateProductStock(prod.id, prod.stock + 10)}
                          className="px-2 py-1 bg-teal-500/15 text-teal-600 hover:bg-teal-500/25 text-[10px] font-mono font-bold border border-teal-200 rounded transition-colors"
                        >
                          +10 Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick overview orders queue */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                <Package className="w-4 h-4 text-teal-600" />
                Fila de Postagem e Preparação Ativa
              </h3>

              {orders.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">Nenhum pedido recebido ainda na plataforma.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {orders.slice(0, 5).map(ord => (
                    <div key={ord.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-900 font-bold">{ord.id}</span>
                          <span className="text-[10px] text-slate-500 font-medium">| {ord.customerName}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          {ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-teal-600 font-bold shrink-0">R$ {ord.total.toFixed(2)}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          ord.orderStatus === 'delivered' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ord.orderStatus === 'canceled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {ord.orderStatus === 'pending' ? 'Pendente' : 
                          ord.orderStatus === 'preparing' ? 'Impressão/Kits' : 
                          ord.orderStatus === 'shipped' ? 'Enviado' : 
                          ord.orderStatus === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <button 
                      onClick={() => setActiveAdminSubTab('orders')}
                      className="text-xs text-teal-600 hover:text-cyan-300 font-semibold mt-2 block"
                    >
                      Ver todos os {orders.length} pedidos &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT LIST & ADD FORM TAB */}
      {activeAdminSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
            <div>
              <h3 className="font-sans font-black text-slate-900 text-base">Banco de Dados de Brinquedos</h3>
              <p className="text-xs text-slate-500 mt-1">Cadastre, edite, exclua e mude em tempo real o estoque de todos os itens do site.</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setNewProductForm({
                  name: '',
                  price: '',
                  description: '',
                  category: 'Fidgets',
                  imageUrl: '🦕',
                  stock: '20',
                  size: '12cm',
                  material: 'PLA Biodegradável Atóxico'
                });
                setIsProductModalOpen(true);
              }}
              className="px-4.5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-650 text-slate-950 font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-400/5 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar Novo Brinquedo
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-sans font-bold text-slate-900 text-sm border-b border-slate-200 pb-3 mb-4">
              Produtos &amp; Kits Registrados ({products.length} no total)
            </h3>

            {filteredProducts.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">Nenhum produto correspondente à sua pesquisa ou estoque.</p>
            ) : (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredProducts.map(prod => {
                  const isUrl = prod.imageUrl && (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://') || prod.imageUrl.startsWith('/') || prod.imageUrl.startsWith('data:'));
                  return (
                    <div key={prod.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-200 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl shrink-0 bg-white rounded-lg h-14 w-14 border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden">
                          {isUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-contain rounded" referrerPolicy="no-referrer" />
                          ) : (
                            prod.imageUrl || '📦'
                          )}
                        </span>
                        <div>
                          <h4 className="text-slate-900 text-sm font-extrabold leading-snug">{prod.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-teal-600 font-bold">R$ {prod.price.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-500">|</span>
                            <span className="text-[9.5px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-full uppercase border border-slate-200">{prod.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100/60 pt-3 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">Estoque:</span>
                          <input
                            id={`stock-input-${prod.id}`}
                            type="number"
                            value={prod.stock}
                            onChange={(e) => onUpdateProductStock(prod.id, parseInt(e.target.value) || 0)}
                            className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center text-xs font-mono text-slate-900 focus:outline-none focus:border-teal-400"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            id={`edit-btn-${prod.id}`}
                            onClick={() => handleStartEdit(prod)}
                            className="p-1.5 bg-white hover:bg-slate-100 hover:text-teal-600 border border-slate-100 rounded text-slate-500 transition-colors cursor-pointer"
                            title="Editar produto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            id={`delete-btn-${prod.id}`}
                            onClick={() => setItemToDelete({ id: prod.id, name: prod.name, type: 'product' })}
                            className="p-1.5 bg-white hover:bg-slate-100 hover:text-red-400 border border-slate-100 rounded text-slate-500 transition-colors cursor-pointer"
                            title="Remover produto"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SALES ORDERS LIST COMPONENT */}
      {activeAdminSubTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-sans font-bold text-slate-900 text-sm border-b border-slate-200 pb-3 mb-4">
            Gestão de Pedidos Registrados ({orders.length} pedidos)
          </h3>

          {filteredOrders.length === 0 ? (
            <p className="text-slate-500 text-xs py-10 text-center">Nenhum pedido cadastrado no sistema.</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-50 rounded-2xl border border-slate-100/80 hover:border-teal-200 transition-all p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-slate-900 font-extrabold">{order.id}</span>
                        <span className="text-[10px] font-mono text-slate-500">| {order.createdAt}</span>
                      </div>
                      <div className="text-slate-400 text-xs mt-1.5 font-sans">
                        Comprador: <strong className="text-slate-900 text-xs">{order.customerName}</strong> ({order.customerPhone}) 
                        <span className="text-slate-500 px-1">|</span> {order.customerEmail}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Payment Status tag */}
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'Pago' : 'Aguardando Pix'}
                      </span>

                      {/* Delivery type tag */}
                      {order.deliveryMethod === 'hand' ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-teal-500/15 border border-teal-500/20 text-teal-300">
                          🤝 Entrega em Mãos
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 border border-slate-200 text-slate-500">
                          🚚 Envio Correios
                        </span>
                      )}

                      {/* Ship Status dropdown selector overlay */}
                      <select
                        id={`order-status-select-${order.id}`}
                        value={order.orderStatus}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])}
                        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] font-sans text-slate-400 focus:outline-none focus:border-teal-400"
                      >
                        <option value="pending">Pendente de Postagem</option>
                        <option value="preparing">Impressora 3D / Produção</option>
                        <option value="shipped">Postado no Correio</option>
                        <option value="delivered">Entrega Efetuada</option>
                        <option value="canceled">Venda Cancelada</option>
                      </select>
                    </div>
                  </div>

                  {/* Items ordered info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 space-y-1.5 pb-2 md:pb-0">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">Lista de Envios</span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>
                            {item.quantity}x <strong className="text-slate-900 text-xs font-semibold">{item.name}</strong> 
                            {item.isBox && item.boxItems && (
                              <span className="text-[10px] text-amber-500 block pl-5">
                                [Box Montada: {item.boxItems.join(', ')}]
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-4 text-left md:text-right border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase">Faturamento Líquido</span>
                      <span className="text-teal-600 font-mono font-bold text-sm">
                        R$ {order.total.toFixed(2)}
                      </span>
                      <span className="block text-[8.5px] font-mono text-slate-450 mt-1 capitalize">
                        Método: {order.paymentMethod === 'pix' ? 'Pix CNPJ' : 'Cartão de Crédito'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SYSTEM CONFIGURATION SYSTEM VARIABLES PANEL */}
      {activeAdminSubTab === 'configs' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="font-sans font-black text-slate-900 text-base">Configurações Gerais do Sistema</h3>
                <p className="text-xs text-slate-500 mt-0.5">Veja as variáveis ambientais ativas na plataforma de compras e faturamento.</p>
              </div>
              <button
                onClick={() => {
                  setSysVars(settings);
                  setIsSettingsModalOpen(true);
                }}
                className="px-4.5 py-2.5 bg-cyan-400 hover:bg-teal-500 text-slate-950 font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-400/5 whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
                Editar Parâmetros do Site
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
              <div className="bg-slate-50/85 p-4 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-500 font-mono uppercase">🔑 Recebimento Pix</span>
                <span className="block text-slate-900 font-bold mt-1.5 font-mono">{settings.pixKeyType || 'CNPJ'}: {settings.pixKeyCode || 'adprint3d'}</span>
                <span className="block text-slate-500 text-[10px] mt-1 italic">Favorecido: {settings.pixBeneficiary || 'AD Print 3D Ltda'}</span>
              </div>

              <div className="bg-slate-50/85 p-4 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-500 font-mono uppercase">💳 Credenciais Mercado Pago</span>
                <span className="block text-emerald-400 font-bold mt-1.5 font-mono">Chaves Conectadas ✔️</span>
                <span className="block text-slate-500 text-[10px] mt-1 italic">Public Key: {settings.mercadoPagoPublicKey ? settings.mercadoPagoPublicKey.substring(0, 15) + '...' : 'Chave de Fábrica'}</span>
              </div>

              <div className="bg-slate-50/85 p-4 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-500 font-mono uppercase">🚚 Frete e Logística</span>
                <span className="block text-orange-400 font-bold mt-1.5">Frete Grátis acima de R$ {settings.freeShippingThreshold.toFixed(2)}</span>
                <span className="block text-slate-500 text-[10px] mt-1">Contato: {settings.whatsappNumber || 'WhatsApp Oficial'}</span>
              </div>

              <div className="bg-slate-50/85 p-4 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-500 font-mono uppercase">🎨 Título do Headline (Home)</span>
                <span className="block text-slate-900 font-black truncate mt-1.5">{settings.heroTitle || 'Brinquedos Sensoriais 3D'}</span>
                <span className="block text-slate-500 text-[10px] truncate mt-0.5">{settings.heroSubtitle}</span>
              </div>



              <div className="bg-slate-50/85 p-4 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-500 font-mono uppercase">🚨 Status de Manutenção</span>
                <span className={`block font-bold mt-1.5 ${settings.maintenanceMode && settings.maintenanceMode.startsWith('Sim') ? 'text-red-500' : 'text-emerald-400'}`}>
                  {settings.maintenanceMode || 'Não - Site ativo no ar'}
                </span>
                <span className="block text-slate-500 text-[10px] mt-0.5">Visível para clientes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUPONS SYSTEM MANAGEMENT */}
      {activeAdminSubTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4">
            <div>
              <h3 className="font-sans font-black text-slate-900 text-base">Cupons de Desconto Cadastrados</h3>
              <p className="text-xs text-slate-500 mt-1">Veja e crie cupons vigentes no e-commerce da AD Print 3D para impulsionar conversões.</p>
            </div>
            <button
              onClick={() => {
                setNewCouponForm({
                  code: '',
                  type: 'percentage',
                  value: '',
                  minSubtotal: '0'
                });
                setIsCouponModalOpen(true);
              }}
              className="px-4.5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-400/5 whitespace-nowrap"
            >
              <Tag className="w-4 h-4" />
              Criar Novo Cupom
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-sans font-bold text-slate-900 text-sm border-b border-slate-200 pb-3 mb-4">
              Lista de Códigos Promocionais Ativos ({coupons.length} corporativos/públicos)
            </h3>

            {coupons.length === 0 ? (
              <p className="text-slate-500 text-xs py-10 text-center">Nenhum cupom de desconto configurado na loja.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="relative bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 flex flex-col justify-between hover:border-teal-200 transition-all">
                    {/* Excluir button */}
                    <button
                      onClick={() => setItemToDelete({ id: coupon.id, name: coupon.code, type: 'coupon' })}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Apagar Cupom"
                    >
                      <Trash className="w-4 h-4" />
                    </button>

                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[9px] font-mono font-black uppercase tracking-wider">
                        🎫 {coupon.type === 'percentage' ? `${coupon.value}% DE DESCONTO` : `R$ ${coupon.value.toFixed(2)} OFF`}
                      </span>
                      <h4 className="font-mono text-lg font-black text-slate-900 mt-4 tracking-wider select-all cursor-pointer" title="Clique para copiar">
                        {coupon.code}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 pb-2 font-medium">
                        Ativação automática para subtotal acima de <strong className="text-slate-200">R$ {coupon.minSubtotal.toFixed(2)}</strong>.
                      </p>
                    </div>

                    <div className="border-t border-slate-100/60 pt-3 mt-3 flex items-center justify-between text-[9px] font-mono uppercase text-slate-500">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 font-sans">
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span> Ativo e Vigente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: REGISTER / EDIT PRODUCT FORM */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-sans font-black text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Edit className="w-4.5 h-4.5 text-teal-600 animate-pulse" />
                    <span>Editar Brinquedo / Kit</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4.5 h-4.5 text-teal-600" />
                    <span>Cadastrar Novo Brinquedo</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Título do Brinquedo / Kit *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Polvo Flexível Tátil"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="54.90"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Categoria Comercial *</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as Product['category'] })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 focus:outline-none transition-colors"
                  >
                    <option value="Fidgets">Fidgets Japoneses / Cliques</option>
                    <option value="Articulados">Articulados Complexos</option>
                    <option value="Sensoriais">Suporte Sensorial TEA/TDAH</option>
                    <option value="Kits">Kit / Box Pronto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Estoque da Impressora</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Tamanho aproximado</label>
                  <input
                    type="text"
                    placeholder="15cm"
                    value={newProductForm.size}
                    onChange={(e) => setNewProductForm({ ...newProductForm, size: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Dynamic image picker */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-3">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase leading-none">Aparência do Brinquedo (Emoji, Link ou Carregamento) *</label>
                
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode('emoji');
                      setNewProductForm(p => ({ ...p, imageUrl: '🦕' }));
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                      imageMode === 'emoji' ? 'bg-teal-500/15 text-teal-600 font-bold border border-cyan-500/10' : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    ✨ Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode('url');
                      setNewProductForm(p => ({ ...p, imageUrl: '' }));
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                      imageMode === 'url' ? 'bg-teal-500/15 text-teal-600 font-bold border border-cyan-500/10' : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    🔗 Link Web
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode('upload');
                      setNewProductForm(p => ({ ...p, imageUrl: '' }));
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                      imageMode === 'upload' ? 'bg-teal-500/15 text-teal-600 font-bold border border-cyan-500/10' : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    📤 Carregar Foto
                  </button>
                </div>

                {imageMode === 'emoji' && (
                  <select
                    value={newProductForm.imageUrl.length <= 4 ? newProductForm.imageUrl : '🦕'}
                    onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2.5 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="🦕">🦕 Dino</option>
                    <option value="🧩">🧩 Peça Lego</option>
                    <option value="⭐">⭐ Estrela</option>
                    <option value="⚙️">⚙️ Engrenagem</option>
                    <option value="🪐">🪐 Orbital</option>
                    <option value="♾️">♾️ Infinito</option>
                    <option value="🔮">🔮 Esfera</option>
                    <option value="🦖">🦖 Dinossauro 2</option>
                    <option value="🐙">🐙 Polvo</option>
                    <option value="📦">📦 Box/Kit</option>
                    <option value="🐚">🐚 Concha</option>
                    <option value="🔥">🔥 Fogo Glow</option>
                  </select>
                )}

                {imageMode === 'url' && (
                  <input
                    type="url"
                    placeholder="Cole o endereço da imagem (http://...)"
                    value={newProductForm.imageUrl.startsWith('http') ? newProductForm.imageUrl : ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                  />
                )}

                {imageMode === 'upload' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-500 file:py-1.5 file:px-3 file:rounded-xl file:bg-teal-50 file:text-teal-600 file:border-none file:text-[10px] cursor-pointer"
                    />
                    {newProductForm.imageUrl.startsWith('data:image/') && (
                      <div className="flex items-center gap-2">
                        <img src={newProductForm.imageUrl} alt="uploaded" className="h-8 w-8 object-contain rounded bg-white border border-slate-200" />
                        <span className="text-[10px] text-emerald-400">Imagem guardada!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Material de Impressão</label>
                  <input
                    type="text"
                    placeholder="PLA Biodegradável Premium"
                    value={newProductForm.material}
                    onChange={(e) => setNewProductForm({ ...newProductForm, material: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Cor Base da Imagem (Filtros)</label>
                  <select
                    value={newProductForm.baseColor || 'Roxo Galáxia'}
                    onChange={(e) => setNewProductForm({ ...newProductForm, baseColor: e.target.value as Product['baseColor'] })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Roxo Galáxia">Roxo (Roxo Galáxia)</option>
                    <option value="Ouro Silk">Amarelo / Dourado (Ouro Silk)</option>
                    <option value="Vermelho Rubi">Vermelho (Vermelho Rubi)</option>
                    <option value="Azul Celeste">Azul (Azul Celeste)</option>
                    <option value="Verde Esmeralda">Verde (Verde Esmeralda)</option>
                    <option value="Preto Carbono">Preto Carbono (Preto Carbono)</option>
                    <option value="Preto Magma">Preto Magma (Preto Magma)</option>
                    <option value="Rosa Choque">Rosa Choque (Rosa Choque)</option>
                    <option value="Cobre Metálico">Cobre Metálico (Cobre Metálico)</option>
                    <option value="Prata Platinado">Prata Platinado (Prata Platinado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Descrição Comercial &amp; Práticas de Estímulo *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Instruções de regulação motora tátil e TEA..."
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none transition-colors resize-none mb-1"
                />
              </div>

              {/* Save or Cancel actions */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 hover:border-slate-300 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-750 text-slate-950 rounded-xl font-sans font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: SYSTEM CONFIGURATIONS FORM */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-sans font-black text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600 animate-spin-slow" />
                <span>Editar Variáveis do Sistema</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfigs} className="space-y-4 text-left">
              {/* SECTION 1: PIX */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-orange-400 font-mono text-[10px] uppercase font-black tracking-wider leading-none">⚙️ Dados para PIX</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Tipo de Chave</label>
                    <select
                      value={sysVars.pixKeyType}
                      onChange={(e) => setSysVars({ ...sysVars, pixKeyType: e.target.value })}
                      className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="Chave Aleatória">Chave Aleatória</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="Celular">Celular</option>
                      <option value="E-mail">E-mail</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Código da Chave</label>
                    <input
                      type="text"
                      value={sysVars.pixKeyCode}
                      onChange={(e) => setSysVars({ ...sysVars, pixKeyCode: e.target.value })}
                      className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Favorecido (Recebedor)</label>
                  <input
                    type="text"
                    value={sysVars.pixBeneficiary}
                    onChange={(e) => setSysVars({ ...sysVars, pixBeneficiary: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: MERCADO PAGO API KEY */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-teal-600 font-mono text-[10px] uppercase font-black tracking-wider leading-none">💳 Mercado Pago SDK</h4>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Mercado Pago Public Key (Public)</label>
                  <input
                    type="text"
                    value={sysVars.mercadoPagoPublicKey}
                    onChange={(e) => setSysVars({ ...sysVars, mercadoPagoPublicKey: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Mercado Pago Access Token (Private)</label>
                  <input
                    type="password"
                    value={sysVars.mercadoPagoAccessToken}
                    onChange={(e) => setSysVars({ ...sysVars, mercadoPagoAccessToken: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* OUTRAS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-teal-400 font-mono text-[10px] uppercase font-black tracking-wider leading-none">🌐 Contato e Frete</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">WhatsApp de Contato</label>
                    <input
                      type="text"
                      value={sysVars.whatsappNumber}
                      onChange={(e) => setSysVars({ ...sysVars, whatsappNumber: e.target.value })}
                      className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Chapa Frete Grátis acima de (R$)</label>
                    <input
                      type="text"
                      value={sysVars.freeShippingThreshold.toString()}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value) || 0;
                        setSysVars({ ...sysVars, freeShippingThreshold: parsed });
                      }}
                      className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>



                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Ativar Modo de Manutenção</label>
                  <select
                    value={sysVars.maintenanceMode}
                    onChange={(e) => setSysVars({ ...sysVars, maintenanceMode: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Não">Não - Site ativo normal no ar</option>
                    <option value="Sim">Sim - Ativar tela de manutenção</option>
                  </select>
                </div>
              </div>

              {/* SEÇÃO HERO HOME */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-yellow-400 font-mono text-[10px] uppercase font-black tracking-wider leading-none">🎨 Headline Banner Principal (Home)</h4>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Texto Título principal</label>
                  <input
                    type="text"
                    value={sysVars.heroTitle}
                    onChange={(e) => setSysVars({ ...sysVars, heroTitle: e.target.value })}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Texto Subtítulo secundário</label>
                  <textarea
                    value={sysVars.heroSubtitle}
                    onChange={(e) => setSysVars({ ...sysVars, heroSubtitle: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl bg-white border border-slate-200 focus:border-teal-400 py-2 px-3 font-sans text-xs text-slate-900 focus:outline-none resize-none"
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 hover:border-slate-300 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-750 text-slate-950 rounded-xl font-sans font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: CREATING A NEW PROMOTIONAL COUPON */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-lg space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-sans font-black text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
                <Tag className="w-4.5 h-4.5 text-teal-400 animate-pulse" />
                <span>Criar Cupom de Desconto</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Código do Cupom *</label>
                <input
                  type="text"
                  required
                  placeholder="EX: ADMEDICINA"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3.5 font-sans text-xs text-slate-900 placeholder-slate-700 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Tipo de Dedução</label>
                  <select
                    value={newCouponForm.type}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Preço Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Valor do Desconto *</label>
                  <input
                    type="number"
                    required
                    placeholder={newCouponForm.type === 'percentage' ? '10' : '20.00'}
                    value={newCouponForm.value}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, value: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Mínimo Subtotal para Ativação (R$)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newCouponForm.minSubtotal}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, minSubtotal: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-400 py-2.5 px-3 font-sans text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Actions footer */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 hover:border-slate-300 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 rounded-xl font-sans font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI GENERATOR TAB */}
      {activeAdminSubTab === 'ai-generator' && (
        <AIGeneratorStudio onAddProduct={onAddProduct} />
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold font-sans text-slate-900 mb-2">Excluir Item</h2>
              <p className="text-sm text-slate-500">
                Tem certeza que deseja excluir <strong>{itemToDelete.name}</strong>?
                Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (itemToDelete.type === 'product') {
                    onDeleteProduct(itemToDelete.id);
                  } else {
                    onDeleteCoupon(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-red-500/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
