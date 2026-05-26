/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Minus, Inbox, Gift, Trash2, ArrowRight, X } from 'lucide-react';
import { FILAMENT_COLORS } from '../App';

interface BoxBuilderProps {
  products: Product[];
  onAddBoxToCart: (items: Product[], totalPrice: number, discountPrice: number) => void;
}

export default function BoxBuilder({ products, onAddBoxToCart }: BoxBuilderProps) {
  const singleProducts = products.filter(p => !p.isKit && p.stock > 0);
  
  // Custom box items state
  const [selectedItems, setSelectedItems] = useState<{
    id: string; // unique ID: `${product.id}-${color}-${size}`
    product: Product;
    color: string;
    secondaryColor?: string;
    customText?: string;
    size: 'P' | 'M' | 'G';
    price: number; // custom calculated price
    quantity: number;
  }[]>([]);

  // Customization popup states
  const [activeCustomizingProduct, setActiveCustomizingProduct] = useState<Product | null>(null);
  const [customColor, setCustomColor] = useState(FILAMENT_COLORS[0]);
  const [customSecondaryColor, setCustomSecondaryColor] = useState(FILAMENT_COLORS[1]);
  const [customText, setCustomText] = useState('');
  const [customSize, setCustomSize] = useState<'P' | 'M' | 'G'>('M');
  const [customFilamentTab, setCustomFilamentTab] = useState<'Ver Todos' | 'Silk' | 'Matte'>('Ver Todos');

  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const itemsCount = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);

  // Progressive discount rules
  let discountPercent = 0;
  if (itemsCount === 1 || itemsCount === 2) {
    discountPercent = 0;
  } else if (itemsCount === 3) {
    discountPercent = 10;
  } else if (itemsCount === 4) {
    discountPercent = 20;
  } else if (itemsCount >= 5) {
    discountPercent = 30;
  }

  // Helper pricing logic
  const getSizeFactor = (size: 'P' | 'M' | 'G') => {
    switch (size) {
      case 'P': return 0.8;
      case 'G': return 1.3;
      case 'M':
      default:
        return 1.0;
    }
  };

  const getCustomPrice = (basePrice: number, size: 'P' | 'M' | 'G', colorCategory: string) => {
    return (basePrice * getSizeFactor(size)) + (colorCategory === 'Silk' ? 10.00 : 0);
  };

  const originalTotal = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const discountAmount = (originalTotal * discountPercent) / 100;
  const finalTotal = originalTotal - discountAmount;

  // Opens customization modal
  const handleOpenCustomizer = (product: Product) => {
    const baseColorName = product.baseColor || 'Roxo Galáxia';
    const matchingColor = FILAMENT_COLORS.find(c => c.name === baseColorName) || FILAMENT_COLORS[0];
    setCustomColor(matchingColor);
    setCustomSecondaryColor(FILAMENT_COLORS.find(c => c.name === 'Preto Carbono') || FILAMENT_COLORS[1]);
    setCustomText('');
    setCustomSize('M');
    setCustomFilamentTab('Ver Todos');
    setActiveCustomizingProduct(product);
  };

  // Confirms configuration and adds to box
  const handleConfirmAddCustomized = () => {
    if (!activeCustomizingProduct) return;
    
    const calculatedPrice = getCustomPrice(activeCustomizingProduct.price, customSize, customColor.category);
    
    const isPersonalizado = ['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeCustomizingProduct.id);
    const secColorName = isPersonalizado ? customSecondaryColor.name : undefined;
    const textVal = isPersonalizado ? customText : undefined;
    
    let itemId = `${activeCustomizingProduct.id}-${customColor.name}-${customSize}`;
    if (isPersonalizado) {
      itemId = `${activeCustomizingProduct.id}-${customColor.name}-${secColorName || 'none'}-${textVal || 'none'}-${customSize}`;
    }
    
    const existingIndex = selectedItems.findIndex(item => item.id === itemId);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: itemId,
          product: activeCustomizingProduct,
          color: customColor.name,
          secondaryColor: secColorName,
          customText: textVal,
          size: customSize,
          price: calculatedPrice,
          quantity: 1
        }
      ]);
    }
    
    setActiveCustomizingProduct(null);
  };

  // Quantity controllers for summary sidebar
  const handleIncrementItem = (itemId: string) => {
    const existingIndex = selectedItems.findIndex(item => item.id === itemId);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const existingIndex = selectedItems.findIndex(item => item.id === itemId);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1;
      } else {
        updated.splice(existingIndex, 1);
      }
      setSelectedItems(updated);
    }
  };

  const handleClearBox = () => {
    setSelectedItems([]);
  };

  // Submits the complete customized Box items to the shopping cart
  const handleAddToCart = () => {
    if (itemsCount < 1) return;
    
    const flattenedProducts: Product[] = [];
    selectedItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        // Create an overridden Product object with customized name and price
        const isPersonalizado = ['letreiro-personalizado', 'porta-lapis-personalizado'].includes(item.product.id);
        let customizedName = `${item.product.name} (${item.color} | Tam: ${item.size})`;
        
        if (isPersonalizado) {
          const displaySecColor = item.secondaryColor || 'Preto Carbono';
          const displayText = item.customText ? `Texto: "${item.customText}"` : 'Sem texto';
          customizedName = `${item.product.name} (${item.color} / ${displaySecColor} | ${displayText} | Tam: ${item.size})`;
        }
        
        const customizedProduct: Product = {
          ...item.product,
          name: customizedName,
          price: item.price
        };
        flattenedProducts.push(customizedProduct);
      }
    });

    onAddBoxToCart(flattenedProducts, originalTotal, finalTotal);
    setSelectedItems([]);
    
    setShowSuccessNotification(true);
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 4000);
  };

  // Filter swatches based on filament category filter tab
  const filteredColors = customFilamentTab === 'Ver Todos'
    ? FILAMENT_COLORS
    : FILAMENT_COLORS.filter(c => c.category === customFilamentTab);

  // Helper to count total quantity of a base product added to the box
  const getProductCountInBox = (productId: string) => {
    return selectedItems
      .filter(item => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 text-left">
      
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed md:top-24 top-4 right-4 z-50 max-w-md rounded-2xl bg-[#4ade80] border-3 border-black p-4 shadow-[4px_4px_0px_#000] text-black font-sans animate-bounce flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-black text-sm uppercase leading-none tracking-wider">Sucesso!</p>
            <p className="text-xs mt-1 font-bold text-slate-800">Sua Box Sensorial foi integrada ao carrinho com desconto progressivo!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fcd34d] border-2 border-black px-4 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_#000] uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5" />
          Descontos Progressivos da Box
        </span>
        <h2 className="mt-5 font-display text-3xl font-black tracking-tight text-black sm:text-4xl uppercase">
          Monte sua <span className="text-[#f87171] underline decoration-black decoration-wavy">Box Sensorial</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-700 text-xs sm:text-sm font-semibold leading-relaxed">
          Escolha os brinquedos favoritos para seu filho, filha ou alunos. Combine e monte a sua box perfeita com descontos progressivos estruturados.
        </p>

        {/* Progress Bar Card */}
        <div className="mx-auto mt-8 max-w-2xl bg-white border-3 border-black rounded-3xl p-6 shadow-[4px_4px_0px_#000]">
          <div className="grid grid-cols-3 text-[10px] font-sans font-black text-slate-400 mb-2.5 uppercase tracking-wider">
            <div className={`text-left ${itemsCount >= 3 ? 'text-black font-black' : ''}`}>
              3 Itens: -10%
            </div>
            <div className={`text-center ${itemsCount >= 4 ? 'text-black font-black' : ''}`}>
              4 Itens: -20%
            </div>
            <div className={`text-right ${itemsCount >= 5 ? 'text-[#f87171] font-black' : ''}`}>
              5+ Itens: -30% 🔥
            </div>
          </div>
          
          <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden border-2 border-black">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                itemsCount >= 5 ? 'bg-gradient-to-r from-amber-400 to-[#f87171]' : 'bg-[#4ade80]'
              }`}
              style={{ width: `${Math.min((itemsCount / 5) * 100, 100)}%` }}
            />
          </div>

          <div className="mt-4 text-xs text-left font-black uppercase tracking-wide">
            {itemsCount === 0 && (
              <span className="text-slate-400">Escolha os produtos abaixo para começar a adicionar itens na sua Box.</span>
            )}
            {itemsCount > 0 && itemsCount < 3 && (
              <span className="text-[#f87171]">Adicione mais {3 - itemsCount} produto(s) para conquistar o desconto de 10%!</span>
            )}
            {itemsCount === 3 && (
              <span className="text-[#4ade80]">Perfeito! Desconto de 10% já ativo. Adicione +1 para atingir 20%!</span>
            )}
            {itemsCount === 4 && (
              <span className="text-[#4ade80]">Incrível! Desconto de 20% já ativo. Adicione mais um para ativar o desconto total de 30%!</span>
            )}
            {itemsCount >= 5 && (
              <span className="text-[#f87171] flex items-center gap-1 animate-pulse">
                <Gift className="w-4 h-4" /> Desconto máximo de 30% aplicado! Frete grátis liberado para sua Box!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Box Configuration Summary */}
        <div id="box-builder-summary-panel" className="lg:col-span-5 bg-white border-3 border-black rounded-3xl p-6 sticky top-28 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
            <h3 className="font-display font-black text-black text-base flex items-center gap-2 uppercase tracking-tight">
              <Inbox className="w-5 h-5 text-black" />
              Sua Box Personalizada
            </h3>
            {itemsCount > 0 && (
              <button 
                onClick={handleClearBox}
                className="text-[10px] text-red-500 hover:underline flex items-center gap-1 font-black uppercase tracking-wider cursor-pointer"
                id="box-clear-btn"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          <div className="space-y-3 min-h-[160px] max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-10 w-10 rounded-xl border-2 border-dashed border-black flex items-center justify-center text-slate-400 mb-3 bg-[#faf6e8]">
                  <Plus className="w-4 h-4 text-black" />
                </div>
                <p className="text-black text-xs font-black uppercase tracking-wider">A sua box está vazia</p>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">Selecione brinquedos na lista à direita.</p>
              </div>
            ) : (
              selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#faf6e8]/30 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl h-8 w-8 flex items-center justify-center bg-white border border-slate-350 rounded-lg overflow-hidden shrink-0 relative">
                      {item.product.imageUrl && (item.product.imageUrl.startsWith('http://') || item.product.imageUrl.startsWith('https://') || item.product.imageUrl.startsWith('/') || item.product.imageUrl.startsWith('data:')) ? (
                        <>
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="h-full w-full object-contain" 
                            referrerPolicy="no-referrer" 
                          />
                          {!['letreiro-personalizado', 'porta-lapis-personalizado'].includes(item.product.id) && (
                            <div 
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              style={{
                                backgroundColor: FILAMENT_COLORS.find(c => c.name === item.color)?.hex || '#a855f7',
                                mixBlendMode: 'color',
                                maskImage: `url(${item.product.imageUrl})`,
                                WebkitMaskImage: `url(${item.product.imageUrl})`,
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskPosition: 'center',
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <span style={{ color: FILAMENT_COLORS.find(c => c.name === item.color)?.hex || '#a855f7' }}>
                          {item.product.imageUrl || '🎁'}
                        </span>
                      )}
                    </span>
                    <div>
                      <h4 className="font-sans font-black text-black text-xs leading-snug line-clamp-1">{item.product.name}</h4>
                      <p className="text-[8.5px] font-bold text-slate-500 uppercase leading-none mt-0.5">
                        {item.secondaryColor 
                          ? `${item.color} / ${item.secondaryColor} ${item.customText ? `| Texto: "${item.customText}"` : ''}`
                          : item.color} | Tam: {item.size}
                      </p>
                      <p className="font-sans text-[9px] text-slate-500 font-extrabold mt-1">R$ {item.price.toFixed(2)} cada</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-6 w-6 rounded-lg bg-white hover:bg-slate-50 text-black flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_#000] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-sans font-black text-xs text-black min-w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrementItem(item.id)}
                      className="h-6 w-6 rounded-lg bg-white hover:bg-slate-50 text-black flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_#000] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing calculations */}
          <div className="border-t-2 border-black pt-4 mt-4 space-y-2 text-xs font-bold text-slate-700">
            <div className="flex justify-between uppercase tracking-wider">
              <span>Quantidade:</span>
              <span className="text-black font-black">{itemsCount} brinquedo(s)</span>
            </div>
            <div className="flex justify-between uppercase tracking-wider">
              <span>Total Bruto:</span>
              <span className="text-black font-black">R$ {originalTotal.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 uppercase tracking-wider font-black">
                <span>Desconto Aplicado ({discountPercent}%):</span>
                <span>- R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between uppercase tracking-wider">
              <span>Entrega:</span>
              <span>
                {itemsCount >= 5 || finalTotal >= 299.90 ? (
                  <span className="text-emerald-700 font-black uppercase bg-[#eefcf3] border border-emerald-250 px-2 py-0.5 rounded text-[9px] shadow-[1px_1px_0px_#000]">GRÁTIS</span>
                ) : (
                  <span className="text-slate-400 text-[10px] font-black uppercase">No checkout</span>
                )}
              </span>
            </div>

            <div className="border-t border-black/10 pt-3 flex justify-between items-center text-black font-black">
              <span className="font-display text-sm uppercase tracking-wider">Preço da Box:</span>
              <div className="text-right">
                {discountPercent > 0 && (
                  <span className="block text-[11px] text-slate-400 line-through">
                    R$ {originalTotal.toFixed(2)}
                  </span>
                )}
                <span className="font-sans text-black text-2xl font-black">
                  R$ {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            id="box-add-to-cart-btn"
            disabled={itemsCount < 1}
            onClick={handleAddToCart}
            className={`w-full mt-5 flex items-center justify-center gap-2 py-3.5 border-2 border-black rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              itemsCount > 0 
                ? 'bg-[#4ade80] text-black shadow-[3px_3px_0px_#000] hover:bg-[#3ec473] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000]' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border-dashed'
            }`}
          >
            Adicionar Box ao Carrinho <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT COLUMN: Available Single Products */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {singleProducts.map((product) => {
              const selectedQty = getProductCountInBox(product.id);
              return (
                <div 
                  key={product.id} 
                  id={`box-item-card-${product.id}`}
                  className="bg-white border-2 border-black rounded-3xl p-4.5 flex flex-col justify-between shadow-[3px_3px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] transition-all group"
                >
                  <div className="flex gap-4 items-start">
                    <div className="h-14 w-14 rounded-2xl bg-[#faf6e8]/45 border-2 border-black flex items-center justify-center text-3xl shrink-0 overflow-hidden p-1 select-none">
                      {product.imageUrl && (product.imageUrl.startsWith('http://') || product.imageUrl.startsWith('https://') || product.imageUrl.startsWith('/') || product.imageUrl.startsWith('data:')) ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="h-full w-full object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        product.imageUrl || '🎁'
                      )}
                    </div>
                    <div>
                      <h4 className="font-sans font-black text-black text-sm leading-tight group-hover:text-[#f87171] transition-colors">{product.name}</h4>
                      <p className="font-sans text-xs font-black text-slate-800 mt-1">R$ {product.price.toFixed(2)}</p>
                      <p className="text-slate-600 text-[10.5px] leading-relaxed mt-1.5 line-clamp-2 font-medium">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-black/10 mt-4 pt-3 flex items-center justify-between">
                    <span className="font-sans text-[8.5px] font-black text-slate-450 uppercase tracking-wider">
                      MEDIDA: {product.size}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {selectedQty > 0 && (
                        <span className="bg-[#eefcf3] border border-emerald-250 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase shadow-[1px_1px_0px_#000]">
                          {selectedQty} na box
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenCustomizer(product)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#fcd34d] hover:bg-[#fbbf24] text-black border-2 border-black font-sans font-black text-[10px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CUSTOMIZATION POPUP MODAL */}
      {activeCustomizingProduct && (
        <div 
          onClick={() => setActiveCustomizingProduct(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full flex flex-col bg-[#faf6e8] border-3 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#000] text-black animate-scale-up"
          >
            <button 
              onClick={() => setActiveCustomizingProduct(null)}
              className="absolute -top-3 -right-3 bg-white border-2 border-black rounded-full p-1.5 hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_#000] hover:scale-110 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer z-10"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <h3 className="font-display font-black text-sm text-black uppercase tracking-wide text-center mb-3">
              Personalizar Item da Box
            </h3>

            {/* Visualizer window frame */}
            <div className="bg-[#111111] border-2 border-black rounded-2xl h-44 relative flex items-center justify-center p-3 overflow-hidden bg-[radial-gradient(#2d2d2d_1.5px,transparent_1.5px)] [background-size:12px_12px] mb-4">
              <div className="absolute inset-2 border border-dashed border-white/20 bg-white/[0.02] rounded-xl pointer-events-none" />
              
              <div 
                className="select-none transition-all duration-300 flex items-center justify-center absolute inset-2 rounded-xl overflow-hidden"
                style={{ 
                  filter: `drop-shadow(0 0 12px ${customColor.hex}40)`,
                  transform: `scale(${getSizeFactor(customSize)})`
                }}
              >
                {activeCustomizingProduct.imageUrl && (activeCustomizingProduct.imageUrl.startsWith('http://') || activeCustomizingProduct.imageUrl.startsWith('https://') || activeCustomizingProduct.imageUrl.startsWith('/') || activeCustomizingProduct.imageUrl.startsWith('data:')) ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src={activeCustomizingProduct.imageUrl} 
                      alt={activeCustomizingProduct.name} 
                      className="w-full h-full object-contain"
                    />
                    {!['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeCustomizingProduct.id) && (
                      <div 
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{
                          backgroundColor: customColor.hex,
                          mixBlendMode: 'color',
                          maskImage: `url(${activeCustomizingProduct.imageUrl})`,
                          WebkitMaskImage: `url(${activeCustomizingProduct.imageUrl})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                        }}
                      />
                    )}
                    {activeCustomizingProduct.id === 'letreiro-personalizado' && customText && (
                      <div 
                        className="absolute bottom-[30px] left-1/2 -translate-x-1/2 w-[90%] text-center font-display font-black text-[10px] uppercase tracking-wide pointer-events-none select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] rotate-[-1.5deg]"
                        style={{ color: customSecondaryColor.hex }}
                      >
                        {customText}
                      </div>
                    )}
                    {activeCustomizingProduct.id === 'porta-lapis-personalizado' && customText && (
                      <div 
                        className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[80%] text-center font-display font-black text-[9px] uppercase tracking-wide pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                        style={{ color: customSecondaryColor.hex }}
                      >
                        {customText}
                      </div>
                    )}
                  </div>
                ) : (
                  <span 
                    className="text-6xl"
                    style={{ color: customColor.hex }}
                  >
                    {activeCustomizingProduct.imageUrl || '📦'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Info */}
              <div className="text-center">
                <h4 className="font-sans font-black text-black text-sm leading-tight">{activeCustomizingProduct.name}</h4>
                <p className="text-[10px] text-slate-500 font-semibold leading-none mt-1 uppercase">Tamanho base: {activeCustomizingProduct.size}</p>
              </div>

              {/* Filament Color Section */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-baseline">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wide">Cor do Filamento:</label>
                  <span className="text-[9px] font-black bg-[#fcd34d] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">{customColor.name}</span>
                </div>

                {/* Color Category Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1.5">
                  {(['Ver Todos', 'Silk', 'Matte'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCustomFilamentTab(tab)}
                      className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        customFilamentTab === tab ? 'bg-black text-white' : 'text-slate-500 hover:text-black hover:bg-slate-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Swatches Grid */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {filteredColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setCustomColor(color)}
                      className={`w-7 h-7 rounded-lg border border-black shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_#000] cursor-pointer flex items-center justify-center transition-all ${
                        customColor.name === color.name ? 'ring-2 ring-black/40 scale-105' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {customColor.name === color.name && (
                        <span className="text-[10px] font-black text-white bg-black/60 rounded-full h-4 w-4 flex items-center justify-center leading-none">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Premium Filament Modifier Notice */}
                {customColor.category === 'Silk' && (
                  <p className="text-[8px] text-[#f87171] font-black uppercase tracking-wide bg-[#fff1f2] border border-[#fecdd3] py-1 rounded text-center animate-pulse mt-1.5">
                    + R$ 10.00 (FILAMENTO SILK)
                  </p>
                )}
              </div>

              {/* Personalização Extras (Text & Secondary Color) */}
              {['letreiro-personalizado', 'porta-lapis-personalizado'].includes(activeCustomizingProduct.id) && (
                <div className="space-y-3 border-t border-b border-black/10 py-3 text-left">
                  {/* Text Input */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wide">
                      {activeCustomizingProduct.id === 'letreiro-personalizado' ? 'Texto do Letreiro:' : 'Nome no Bolso:'}
                    </label>
                    <input
                      type="text"
                      maxLength={activeCustomizingProduct.id === 'letreiro-personalizado' ? 25 : 12}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder={activeCustomizingProduct.id === 'letreiro-personalizado' ? 'Ex: LOVE 3D' : 'Ex: ALEX'}
                      className="w-full px-2.5 py-1.5 border border-black rounded-lg text-[10px] font-bold uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-black placeholder-slate-400 bg-slate-50 text-black"
                    />
                    <div className="flex justify-between text-[7px] font-bold text-slate-400">
                      <span>Máx: {activeCustomizingProduct.id === 'letreiro-personalizado' ? 25 : 12} letras</span>
                      <span>{customText.length}/{activeCustomizingProduct.id === 'letreiro-personalizado' ? 25 : 12}</span>
                    </div>
                  </div>

                  {/* Secondary Color Picker */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wide">
                        {activeCustomizingProduct.id === 'letreiro-personalizado' ? 'Cor do Texto:' : 'Cor dos Detalhes/Cordão:'}
                      </label>
                      <span className="text-[9px] font-black bg-black text-white px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                        {customSecondaryColor.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                      {FILAMENT_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setCustomSecondaryColor(color)}
                          className={`w-7 h-7 rounded-lg border border-black shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center transition-all ${
                            customSecondaryColor.name === color.name ? 'ring-2 ring-black/40 scale-105' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {customSecondaryColor.name === color.name && (
                            <span className="text-[10px] font-black text-white bg-black/60 rounded-full h-4 w-4 flex items-center justify-center leading-none">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Scale / Size selector */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wide">Escala / Tamanho do Modelo:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['P', 'M', 'G'] as const).map((size) => {
                    const sizeLabels = { P: '50%', M: '100%', G: '150%' };
                    const isActive = customSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setCustomSize(size)}
                        className={`py-1 rounded-lg border border-black text-[10px] font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_#000] flex flex-col items-center justify-center ${
                          isActive ? 'bg-[#f87171] text-white shadow-[0.5px_0.5px_0px_#000]' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span>{size}</span>
                        <span className="text-[7px] opacity-75 font-normal">{sizeLabels[size]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleConfirmAddCustomized}
                className="w-full mt-2 py-3 bg-[#4ade80] border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:bg-[#3ec473] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] cursor-pointer text-center text-black block transition-all"
              >
                Confirmar &amp; Adicionar à Box - R$ {getCustomPrice(activeCustomizingProduct.price, customSize, customColor.category).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
