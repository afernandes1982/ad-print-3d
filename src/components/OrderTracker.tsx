/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order } from '../types';
import { Search, MapPin, Truck, CheckCircle, Flame, Layers, Box, Loader2 } from 'lucide-react';

interface OrderTrackerProps {
  orders: Order[];
}

export default function OrderTracker({ orders }: OrderTrackerProps) {
  const [searchId, setSearchId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim();
    if (!id) return;

    setHasSearched(true);
    setFoundOrder(null);
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFoundOrder(data);
      } else {
        setFoundOrder(null);
        if (response.status === 404) {
          setErrorMessage('Pedido não encontrado');
        } else {
          setErrorMessage('Erro ao consultar o servidor');
        }
      }
    } catch (err) {
      console.error(err);
      setFoundOrder(null);
      setErrorMessage('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const isHandDelivery = foundOrder?.deliveryMethod === 'hand';

  // Steps configuration
  const steps = [
    { title: 'Confirmado', desc: 'Sinal Pix aprovado', icon: CheckCircle },
    { title: 'Impressão 3D', desc: 'Nozzle aquecido, depositando PLA', icon: Flame },
    { title: 'Finalização', desc: 'Acabamento & brinde especial', icon: Layers },
    { 
      title: isHandDelivery ? 'Pronto para Entrega' : 'Enviado', 
      desc: isHandDelivery ? 'Dia e hora a combinar com vendedor' : 'Postado nos Correios', 
      icon: Truck 
    },
    { 
      title: isHandDelivery ? 'Entregue em Mãos' : 'Entregue', 
      desc: isHandDelivery ? 'Pedido entregue pessoalmente' : 'Recebido na sua casa', 
      icon: Box 
    }
  ];

  const getActiveStepIndex = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'canceled': return -1;
      default: return 0;
    }
  };

  const activeIndex = foundOrder ? getActiveStepIndex(foundOrder.orderStatus) : -1;

  return (
    <div className="py-8 max-w-3xl mx-auto px-4 text-left">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1 bg-[#fcd34d] text-black text-xs px-3 py-1 rounded-full font-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
          🛸 TRANSPARÊNCIA TOTAL AD PRINT 3D
        </span>
        <h2 className="text-3xl font-display font-black text-black mt-4 uppercase tracking-tight">
          Rastrear <span className="text-[#f87171] underline decoration-black decoration-wavy">Linha de Produção</span>
        </h2>
        <p className="text-slate-700 text-xs mt-2.5 max-w-md mx-auto font-semibold">
          Insira o código do seu pedido (recebido na tela de checkout, ex: AD482103) para acompanhar o progresso das impressoras 3D e postagem.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 bg-white p-2 rounded-2xl border-3 border-black shadow-[3px_3px_0px_#000]">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-3.5 text-black w-4.5 h-4.5" />
          <input
            id="order-tracker-search-input"
            type="text"
            required
            placeholder="Digite o ID do pedido (ex: AD123456)..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full bg-[#faf6e8]/40 border-2 border-black rounded-xl py-2.5 px-10 text-xs text-black placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          id="order-tracker-search-btn"
          type="submit"
          className="bg-[#4ade80] text-black px-6 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer select-none"
        >
          Pesquisar
        </button>
      </form>

      {/* SEARCH RESULTS BOARD */}
      {hasSearched && (
        <div id="tracker-result-panel" className="bg-white rounded-3xl border-3 border-black p-6 md:p-8 shadow-[4px_4px_0px_#000] animate-fadeIn">
          {isLoading ? (
            <div className="text-center py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Buscando pedido no servidor...</span>
            </div>
          ) : !foundOrder ? (
            <div className="text-center py-6">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-black font-black text-sm mt-3 uppercase">{errorMessage || 'Código não localizado'}</h3>
              <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto font-semibold">
                Confirme seu ID (deve ser digitado com as letras 'AD' e números). Se você acabou de criar o pedido, aguarde a sincronização.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between border-b-2 border-black pb-4 gap-4">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">PEDIDO ATIVO</span>
                  <h3 className="font-mono text-black text-base font-black">{foundOrder.id}</h3>
                  <p className="text-slate-650 text-xs mt-1 font-semibold">Destinatário: <strong className="text-black">{foundOrder.customerName}</strong></p>
                  {foundOrder.deliveryMethod === 'hand' && (
                    <span className="inline-flex items-center gap-1 bg-[#eefcf3] text-emerald-800 text-[9.5px] px-2.5 py-0.5 rounded-full border border-black font-black mt-2 shadow-[1px_1px_0px_#000] uppercase">
                      🤝 Entrega em Mãos (SP Capital)
                    </span>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">FATURAMENTO</span>
                  <span className="text-black font-mono font-black text-base block">R$ {foundOrder.total.toFixed(2)}</span>
                  <span className="text-slate-500 text-[10px] block mt-0.5 capitalize font-bold">Via Pix / Cartão</span>
                </div>
              </div>

              {foundOrder.orderStatus === 'canceled' ? (
                <div className="bg-red-50 border-2 border-red-200 text-red-600 rounded-xl p-4 text-center">
                  <h4 className="font-black text-sm uppercase">Este pedido foi Cancelado</h4>
                  <p className="text-xs mt-1 font-semibold">Entre em contato via WhatsApp suporte para estorno ou troca de filamento.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Telemetry view */}
                  {foundOrder.orderStatus === 'preparing' && (
                    <div className="bg-[#faf6e8] p-4 border-2 border-black rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-[2px_2px_0px_#000]">
                      <div className="shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-white border-2 border-black text-xl shadow-[1.5px_1.5px_0px_#000]">
                        🤖
                      </div>
                      <div className="flex-grow w-full text-center sm:text-left">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 justify-center sm:justify-start">
                          <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" /> TELEMETRIA: IMPRESSORAS EM ATIVIDADE
                        </span>
                        <h4 className="text-xs text-black mt-1 font-extrabold">Extrusora depositando camadas de PLA a 210°C... (Camada 145/240)</h4>
                        
                        <div className="relative h-3.5 w-full rounded-full bg-white border-2 border-black mt-3 overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-[#4ade80] rounded-full animate-pulse transition-all duration-300" style={{ width: '64%' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TIMELINE STEPS */}
                  <div className="relative pl-8 space-y-6 after:absolute after:top-1.5 after:bottom-1.5 after:left-3 after:w-[3px] after:bg-black">
                    {steps.map((st, i) => {
                      const isCompletedIdx = i <= activeIndex;
                      const isCurrentIdx = i === activeIndex;
                      const StepIcon = st.icon;

                      return (
                        <div key={i} className="relative flex items-start gap-4">
                          {/* Checked circle icon */}
                          <div className={`absolute -left-[28.5px] z-10 flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 border-black transition-all ${
                            isCompletedIdx
                              ? 'bg-[#4ade80] text-black scale-110'
                              : 'bg-white text-transparent'
                          }`}>
                            {isCompletedIdx && <span className="text-[10px] font-black leading-none">✓</span>}
                          </div>

                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black shrink-0 transition-all shadow-[1.5px_1.5px_0px_#000] ${
                            isCurrentIdx
                              ? 'bg-[#fcd34d] text-black scale-105'
                              : isCompletedIdx
                              ? 'bg-[#eefcf3] text-black'
                              : 'bg-white text-slate-400'
                          }`}>
                            <StepIcon className="w-4.5 h-4.5" />
                          </div>

                          <div className="pt-0.5">
                            <h4 className={`text-xs font-black leading-none uppercase ${
                              isCurrentIdx ? 'text-black font-black' : isCompletedIdx ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {st.title} {isCurrentIdx && '• Em Produção'}
                            </h4>
                            <p className="text-[10.5px] text-slate-600 mt-1 font-semibold">{st.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
