/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OrderItem, Order, ECommerceSettings, Coupon } from '../types';
import { X, QrCode, ClipboardCheck, Clipboard, Heart, CheckCircle2, ShieldCheck, Loader2, Trash2, Plus, Minus } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  cartTotal: number;
  discount: number;
  shipping: number;
  onSubmitOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => void;
  settings: ECommerceSettings;
  coupons: Coupon[];
  onUpdateQuantity?: (productId: string, delta: number, isBox?: boolean) => void;
  onRemoveItem?: (productId: string, isBox?: boolean) => void;
  onClearCart?: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  cartTotal,
  discount,
  shipping,
  onSubmitOrder,
  settings,
  coupons = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CheckoutModalProps) {
  // Steps: 'cart' (Stage 1) | 'info' (Stage 2) | 'payment' (Stage 3) | 'success'
  const [step, setStep] = useState<'cart' | 'info' | 'payment' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zip: '',
    address: '',
    num: '',
    state: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [pixStatusTimer, setPixStatusTimer] = useState<'waiting' | 'paid'>('waiting');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'hand'>('standard');

  // Backend Integration State
  const [generatedOrder, setGeneratedOrder] = useState<any>(null);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSimulation, setIsSimulation] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Reset modal states when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setStep('cart');
      setPixStatusTimer('waiting');
      setCouponCodeInput('');
      setAppliedCoupon(null);
      setCouponError('');
      setDeliveryMethod('standard');
      setGeneratedOrder(null);
      setErrorMessage('');
      setIsSimulation(false);
    }
  }, [isOpen]);

  const computedCouponDiscount = appliedCoupon
    ? (appliedCoupon.type === 'percentage'
      ? (cartTotal * (appliedCoupon.value / 100))
      : appliedCoupon.value)
    : 0;

  const effectiveShipping = deliveryMethod === 'hand' ? 0 : shipping;
  const totalDiscount = discount + computedCouponDiscount;
  const finalTotalAmount = Math.max(0, cartTotal - totalDiscount + effectiveShipping);

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    setCouponError('');
    const typed = couponCodeInput.trim().toUpperCase();
    if (!typed) {
      setCouponError('Insira um código de cupom!');
      return;
    }

    const matched = coupons.find(c => c.code.trim().toUpperCase() === typed && c.isActive);
    if (!matched) {
      setCouponError('Cupom inválido ou expirado!');
      setAppliedCoupon(null);
      return;
    }

    if (cartTotal < matched.minSubtotal) {
      setCouponError(`Subtotal mínimo para este cupom é R$ ${matched.minSubtotal.toFixed(2)}!`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(matched);
    setCouponError('');
  };

  const handleRemoveCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  // Call Express backend to create Mercado Pago preference or payment
  const startCheckout = async (method: 'pix' | 'credit_card') => {
    setIsGeneratingPayment(true);
    setErrorMessage('');
    setGeneratedOrder(null);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          deliveryMethod,
          zip: formData.zip,
          address: formData.address,
          num: formData.num,
          state: formData.state,
          items: cartItems,
          paymentMethod: method,
          total: finalTotalAmount,
          discount: totalDiscount,
          shipping: effectiveShipping
        })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedOrder(data.order);
        setIsSimulation(!!data.simulation);
        if (data.order.id) {
          setOrderId(data.order.id);
        }
      } else {
        setErrorMessage(data.error || 'Erro ao processar checkout');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro de conexão com o servidor de pagamentos.');
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  // Real Webhook Polling OR Simulated PIX Auto-Success
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (step === 'payment' && paymentMethod === 'pix' && generatedOrder) {
      if (isSimulation) {
        // Simulation mode: auto-approves after 5 seconds
        if (pixStatusTimer === 'waiting') {
          timeout = setTimeout(() => {
            setPixStatusTimer('paid');
            setIsLoading(true);
            setTimeout(() => {
              onSubmitOrder({
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                items: cartItems,
                total: finalTotalAmount,
                discount: totalDiscount,
                shipping: effectiveShipping,
                paymentMethod: 'pix',
                paymentStatus: 'paid',
                orderStatus: 'preparing',
                deliveryMethod: deliveryMethod,
                pixCode: 'simulation-code'
              });
              setIsLoading(false);
              setStep('success');
            }, 1200);
          }, 5000);
        }
      } else {
        // Real API Mode: Poll backend order status every 3 seconds
        interval = setInterval(async () => {
          try {
            const res = await fetch(`/api/orders/${generatedOrder.id}`);
            const data = await res.json();
            if (data && data.paymentStatus === 'paid') {
              setPixStatusTimer('paid');
              setIsLoading(true);
              clearInterval(interval);
              setTimeout(() => {
                onSubmitOrder({
                  customerName: formData.name,
                  customerEmail: formData.email,
                  customerPhone: formData.phone,
                  items: cartItems,
                  total: finalTotalAmount,
                  discount: totalDiscount,
                  shipping: effectiveShipping,
                  paymentMethod: 'pix',
                  paymentStatus: 'paid',
                  orderStatus: 'preparing',
                  deliveryMethod: deliveryMethod,
                  pixCode: generatedOrder.pixCode
                });
                setIsLoading(false);
                setStep('success');
              }, 1200);
            }
          } catch (e) {
            console.error('Erro ao verificar status do pagamento:', e);
          }
        }, 3000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [step, paymentMethod, generatedOrder, isSimulation, pixStatusTimer]);

  if (!isOpen) return null;

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    if (deliveryMethod === 'standard' && !formData.address) {
      alert('Por favor, preencha o seu endereço de entrega completo!');
      return;
    }

    if (deliveryMethod === 'hand') {
      const stateUpper = (formData.state || '').trim().toUpperCase();
      if (stateUpper && stateUpper !== 'SP') {
        alert('A entrega em mãos está disponível exclusivamente para SP Capital!');
        return;
      }
      if (!formData.address.trim()) {
        formData.address = 'A combinar (São Paulo - Capital)';
      }
    }

    setStep('payment');
    startCheckout(paymentMethod);
  };

  const handleCardPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
      alert('Preencha as informações do cartão corretamente!');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const finalTotal = finalTotalAmount;
      onSubmitOrder({
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        items: cartItems,
        total: finalTotal,
        discount: totalDiscount,
        shipping: effectiveShipping,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        orderStatus: 'preparing',
        deliveryMethod: deliveryMethod
      });
      const generatedRandomId = 'AD' + Math.floor(Math.random() * 900000 + 100000);
      setOrderId(generatedRandomId);
      setStep('success');
    }, 2000);
  };

  const copyPixCode = () => {
    const code = generatedOrder?.pixCode || `00020126580014BR.GOV.BCB.PIX0136${settings.pixKeyCode || 'adprint3d'}52040000530398654070` + finalTotalAmount.toFixed(2).replace('.', '');
    navigator.clipboard.writeText(code);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  // Helper to extract clean attributes for cart item card display
  const parseCartItemAttributes = (name: string) => {
    const match = name.match(/\(([^)]+)\)/);
    if (!match) return { cleanName: name, color: '', size: '' };
    
    const cleanName = name.replace(/\s*\([^)]+\)/g, '');
    const parts = match[1].split('|').map(p => p.trim());
    
    // Find color (e.g. Ouro Silk, Cobre Metálico) and size (e.g. M, G)
    const color = parts[0] || '';
    const size = parts.find(p => p.startsWith('Tam:') || p.length === 1 || p === 'P' || p === 'M' || p === 'G' || p === 'GG') || '';
    
    return {
      cleanName,
      color: color.toUpperCase(),
      size: size.replace('Tam:', '').trim().toUpperCase()
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border-3 border-black bg-[#faf6e8] shadow-[4px_4px_0px_#000] p-6 sm:p-8 text-black">
        
        {/* Close Button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-black border-2 border-black rounded-lg p-1 bg-white hover:bg-slate-50 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
            id="close-checkout-modal-btn"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Header - Sacola & Checkout */}
        <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-5 text-left">
          <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <span className="text-xl">🖨️</span>
          </div>
          <div>
            <h3 className="font-display font-black text-base uppercase leading-none">Sacola &amp; Checkout</h3>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider leading-none">Estações de Impressão Ativas</span>
          </div>
        </div>

        {/* Step Navigation Pill Indicator */}
        {step !== 'success' && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => step !== 'cart' && setStep('cart')}
              className={`py-1.5 px-1 border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-wider text-center ${
                step === 'cart' ? 'bg-[#fcd34d]' : 'bg-white text-slate-500 hover:text-black'
              }`}
            >
              1. Sacola ({cartItems.length})
            </button>
            <button
              onClick={() => step === 'payment' && setStep('info')}
              className={`py-1.5 px-1 border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-wider text-center ${
                step === 'info' ? 'bg-[#fcd34d]' : 'bg-white text-slate-500'
              }`}
              disabled={step === 'cart'}
            >
              2. Envio Postal
            </button>
            <div
              className={`py-1.5 px-1 border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-wider text-center ${
                step === 'payment' ? 'bg-[#fcd34d]' : 'bg-white text-slate-500'
              }`}
            >
              3. Pagamento
            </div>
          </div>
        )}

        {/* STEP 1: SACOLA (Cart list review) */}
        {step === 'cart' && (
          <div className="space-y-4 text-left">
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {cartItems.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-3xl">🧺</span>
                  <p className="text-xs font-black text-slate-500 uppercase mt-2">Sua sacola está vazia.</p>
                </div>
              ) : (
                cartItems.map((item) => {
                  const details = parseCartItemAttributes(item.name);
                  return (
                    <div key={item.productId} className="bg-white border-2 border-black rounded-2xl p-3.5 flex gap-3 shadow-[2.5px_2.5px_0px_#000] items-center">
                      
                      {/* Mini Thumbnail */}
                      <div className="w-12 h-12 bg-[#faf6e8] border border-slate-200 rounded-lg flex items-center justify-center shrink-0 text-2xl select-none">
                        {item.isBox ? '📦' : '🧩'}
                      </div>

                      {/* Name and Attributes */}
                      <div className="flex-grow">
                        <h4 className="text-[11.5px] font-black text-black leading-snug line-clamp-1">
                          {details.cleanName}
                        </h4>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {details.color && (
                            <span className="bg-slate-100 border border-slate-300 text-slate-600 text-[7.5px] font-black px-1.5 py-0.5 rounded leading-none">
                              {details.color}
                            </span>
                          )}
                          {details.size && (
                            <span className="bg-slate-100 border border-slate-300 text-slate-600 text-[7.5px] font-black px-1.5 py-0.5 rounded leading-none">
                              TAM: {details.size}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls and Price */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-black text-black leading-none">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        
                        <div className="flex items-center gap-1 bg-slate-50 border border-black px-1 py-0.5 rounded-lg mt-1 scale-90 shadow-[1px_1px_0px_#000]">
                          <button
                            onClick={() => onUpdateQuantity?.(item.productId, -1, item.isBox)}
                            className="text-slate-500 hover:text-black p-0.5"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[10px] font-black min-w-3 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity?.(item.productId, 1, item.isBox)}
                            className="text-slate-500 hover:text-black p-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => onRemoveItem?.(item.productId, item.isBox)}
                            className="text-slate-400 hover:text-red-500 ml-1 border-l border-black/15 pl-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Subtotal summary and Actions */}
            {cartItems.length > 0 && (
              <div className="border-t-2 border-black pt-4 space-y-3.5">
                <div className="flex justify-between items-baseline">
                  <button
                    onClick={() => onClearCart?.()}
                    className="text-[9px] font-black text-red-500 hover:underline uppercase tracking-wider"
                  >
                    Limpar Sacola de Compras
                  </button>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block leading-none">SUBTOTAL:</span>
                    <span className="font-display font-black text-xl text-black block mt-1 leading-none">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('info')}
                  className="w-full py-3.5 bg-[#f87171] border-2 border-black text-white font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] cursor-pointer text-center block transition-all"
                >
                  Seguir Para Envio →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Customer Information Form (Envio) */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-4 text-left">
            <div className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro de Alcântara"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl bg-white border-2 border-black focus:bg-slate-50 py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Seu Email Seguro *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: pedro@provedor.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl bg-white border-2 border-black focus:bg-slate-50 py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">WhatsApp / Celular *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl bg-white border-2 border-black focus:bg-slate-50 py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Opção de Entrega *</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => {
                      const method = e.target.value as 'standard' | 'hand';
                      setDeliveryMethod(method);
                      if (method === 'hand') {
                        setFormData(prev => ({ ...prev, state: 'SP', address: 'A combinar (São Paulo - Capital)' }));
                      } else {
                        setFormData(prev => ({ ...prev, state: '', address: '' }));
                      }
                    }}
                    className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black focus:outline-none font-bold"
                  >
                    <option value="standard">🚚 Envio Correios</option>
                    <option value="hand">🤝 Entrega em Mãos</option>
                  </select>
                </div>
              </div>

              {deliveryMethod === 'hand' && (
                <div className="p-3 bg-[#eefcf3] border-2 border-black rounded-2xl">
                  <p className="text-[10px] text-emerald-800 font-black uppercase">🤝 Entrega em Mãos Capital SP</p>
                  <p className="text-[9.5px] text-emerald-700 font-semibold leading-relaxed mt-1">
                    Entrega combinada exclusivamente em São Paulo - Capital. Os detalhes serão combinados via WhatsApp.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">CEP *</label>
                  <div className="relative flex gap-1">
                    <input
                      type="text"
                      required
                      placeholder="01311-200"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full rounded-xl bg-white border-2 border-black py-2 px-2.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none shrink"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Endereço de Entrega *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, Avenida, Logradouro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                    disabled={deliveryMethod === 'hand'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Número</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={formData.num}
                    onChange={(e) => setFormData({ ...formData, num: e.target.value })}
                    className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={deliveryMethod === 'hand' ? 'São Paulo' : ''}
                    className="w-full rounded-xl bg-slate-100 border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                    disabled
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Estado (UF) *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                    disabled={deliveryMethod === 'hand'}
                  />
                </div>
              </div>
            </div>

            {/* Promo Coupon Card */}
            <div className="bg-white border-2 border-black p-3.5 rounded-2xl shadow-[2px_2px_0px_#000] space-y-2.5">
              <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Possui Cupom de Desconto?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: ADPRIMEIRO"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  className="flex-grow rounded-xl bg-[#faf6e8]/40 border-2 border-black py-2 px-3 font-sans text-xs font-black uppercase tracking-wider placeholder-slate-400 focus:outline-none"
                  disabled={appliedCoupon !== null}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Excluir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-[#fcd34d] hover:bg-[#fbbf24] text-black border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-[1.5px_1.5px_0px_#000]"
                  >
                    Aplicar
                  </button>
                )}
              </div>
              {couponError && <p className="text-[9.5px] text-red-500 font-black pl-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-[10px] text-emerald-600 font-black pl-1">
                  ✓ Cupom [ {appliedCoupon.code} ] ATIVO!
                </p>
              )}
            </div>

            {/* Invoice Summary */}
            <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_#000] space-y-1.5 text-xs font-bold text-slate-650">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-black">R$ {cartTotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Cupom / Descontos:</span>
                  <span>- R$ {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Custo de Envio:</span>
                <span>{deliveryMethod === 'hand' ? 'Grátis' : effectiveShipping === 0 ? 'Grátis' : `R$ ${effectiveShipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-2 text-black font-black text-sm uppercase">
                <span>Total Estimado:</span>
                <span>R$ {finalTotalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="flex-1 py-3 bg-white border-2 border-black rounded-xl text-xs font-black uppercase tracking-widest shadow-[2.5px_2.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-center"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 bg-[#4ade80] border-2 border-black text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-[2.5px_2.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-center"
              >
                Seguir para Pagamento →
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PROCEDIMENTO DE PAGAMENTO */}
        {step === 'payment' && (
          <div className="space-y-5 text-left">
            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border-2 border-black">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('pix');
                  startCheckout('pix');
                }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  paymentMethod === 'pix' ? 'bg-black text-white' : 'text-slate-500 hover:text-black'
                }`}
              >
                ⚡ Pix Automático
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('credit_card');
                  startCheckout('credit_card');
                }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  paymentMethod === 'credit_card' ? 'bg-black text-white' : 'text-slate-500 hover:text-black'
                }`}
              >
                💳 Cartão de Crédito
              </button>
            </div>

            {paymentMethod === 'pix' ? (
              <div className="bg-white border-2 border-black rounded-3xl p-5 text-center space-y-4 shadow-[2px_2px_0px_#000]">
                {isGeneratingPayment ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gerando QR Code Pix...</span>
                  </div>
                ) : errorMessage ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-red-500 font-black uppercase">Erro de Pagamento</p>
                    <p className="text-[10px] text-slate-650 mt-1 font-semibold leading-relaxed">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => startCheckout('pix')}
                      className="mt-3 px-3 py-1.5 bg-[#fcd34d] border-2 border-black text-[9px] font-black uppercase rounded-lg shadow-[1.5px_1.5px_0px_#000]"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto h-32 w-32 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#000] overflow-hidden p-1">
                      {generatedOrder?.pixQrCodeBase64 ? (
                        <img src={`data:image/png;base64,${generatedOrder.pixQrCodeBase64}`} alt="QR Code PIX" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-24 h-24 text-black animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase">Beneficiário Comercial</p>
                      <p className="text-[10px] text-slate-700 font-bold leading-none">{settings.pixBeneficiary || 'AD PRINT 3D Soluções Ltda'}</p>
                      <p className="text-[9.5px] text-[#f87171] font-black select-all uppercase mt-1">
                        {settings.pixKeyType || 'Chave PIX'}: {settings.pixKeyCode || '54.522.109/0001-33'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={copyPixCode}
                        className="mx-auto flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-xl bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                      >
                        {copiedCodes ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                        {copiedCodes ? 'Código Copiado!' : 'Copiar Pix Copia & Cola'}
                      </button>
                    </div>

                    {/* Processing banner */}
                    <div className="pt-3 border-t border-black/10 flex items-center justify-center gap-2">
                      {pixStatusTimer === 'waiting' ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-orange-600 font-black uppercase tracking-wider">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                          <span>Aguardando transferência na rede...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                          <span>Pix Recebido! Concluindo pedido...</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              isSimulation ? (
                <form onSubmit={handleCardPaymentSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Nome Impresso no Cartão *</label>
                    <input
                      type="text"
                      required
                      placeholder="JOAO DA SILVA"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Número do Cartão *</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="4544 1234 5678 9012"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Validade *</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">CVV / Segurança *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        className="w-full rounded-xl bg-white border-2 border-black py-2 px-3.5 font-sans text-xs text-black placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#4ade80] border-2 border-black text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando...
                      </span>
                    ) : (
                      `Confirmar e Pagar R$ ${finalTotalAmount.toFixed(2)}`
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-white border-2 border-black rounded-3xl p-5 text-center space-y-4 shadow-[2px_2px_0px_#000]">
                  <div className="mx-auto h-16 w-16 bg-[#faf6e8] border-2 border-black rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#000] text-3xl">
                    💳
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-black uppercase">Pagamento via Cartão de Crédito</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Clique abaixo para pagar de forma 100% segura no ambiente do Mercado Pago.</p>
                  </div>
                  
                  {isGeneratingPayment ? (
                    <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-orange-600 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" /> Gerando link seguro...
                    </div>
                  ) : errorMessage ? (
                    <div className="py-2 text-center">
                      <p className="text-xs text-red-500 font-black">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => startCheckout('credit_card')}
                        className="mt-2 px-3 py-1 bg-[#fcd34d] border-2 border-black text-[9px] font-black uppercase rounded-lg shadow-[1.5px_1.5px_0px_#000]"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : (
                    <a
                      href={generatedOrder?.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#4ade80] border-2 border-black text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_#000] hover:bg-[#3ec473] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] cursor-pointer text-center block transition-all"
                    >
                      Pagar Agora no Mercado Pago
                    </a>
                  )}
                </div>
              )
            )}

            {/* Back button */}
            <button
              onClick={() => setStep('info')}
              className="w-full py-2.5 bg-white border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Voltar
            </button>

            <div className="flex gap-2 items-center justify-center text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[9px] font-black uppercase tracking-wider">Conexão Segura SSL Integrada</span>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS PAGE */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-display font-black text-xl text-black uppercase tracking-tight">Pedido Confirmado!</h3>
              <p className="text-xs text-slate-650 mt-1.5 mx-auto max-w-sm font-semibold">
                Obrigado por comprar na <strong className="text-black">AD PRINT 3D</strong>! O processo de modelagem e fila de impressão foi programado imediatamente.
              </p>
            </div>

            {/* Meta invoice summary card */}
            <div className="bg-white border-2 border-black p-4.5 rounded-2xl text-left space-y-2 shadow-[3px_3px_0px_#000] max-w-sm mx-auto text-xs">
              <div className="flex justify-between border-b border-black/10 pb-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase">MÁQUINA</span>
                <span className="text-[9px] text-emerald-600 font-black uppercase">Impressão Programada 🤖</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Código:</span>
                <span className="font-black select-all bg-[#faf6e8] px-2 py-0.5 border border-black rounded leading-none">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Status:</span>
                <span className="text-[9px] text-orange-600 font-black uppercase bg-orange-50 border border-orange-200 px-2 py-0.5 rounded leading-none">Fila de Produção</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Cliente:</span>
                <span className="font-black">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Entrega:</span>
                <span className="text-[#f87171] font-black">{deliveryMethod === 'hand' ? '🤝 Entrega em Mãos' : '🚚 Envio Correios'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Valor Pago:</span>
                <span className="font-black">R$ {finalTotalAmount.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Enviaremos atualizações no seu WhatsApp <strong className="text-black">{formData.phone}</strong> e no e-mail <strong className="text-black">{formData.email}</strong>. Use o código para rastrear seu pedido em tempo real!
            </p>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#fcd34d] border-2 border-black text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#fbbf24] shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer inline-flex items-center gap-1.5"
            >
              Continuar Navegando <Heart className="w-3.5 h-3.5 fill-black" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
