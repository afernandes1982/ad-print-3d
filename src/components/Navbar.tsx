/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, LayoutDashboard, Sparkles, HelpCircle, ShoppingCart, ShieldCheck } from 'lucide-react';
import logo3D from '../logo_3d_printer.png';

interface NavbarProps {
  currentTab: 'shoppe' | 'box-builder' | 'about' | 'admin' | 'orders';
  setTab: (tab: 'shoppe' | 'box-builder' | 'about' | 'admin' | 'orders') => void;
  cartCount: number;
  onOpenCart: () => void;
  isAdmin: boolean;
}

export default function Navbar({ currentTab, setTab, cartCount, onOpenCart, isAdmin }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-[3px] border-black bg-white py-3">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo and Brand - AD PRINT 3D style */}
        <button 
          onClick={() => setTab('shoppe')} 
          className="flex items-center gap-2.5 group focus:outline-none"
          id="navbar-logo-btn"
        >
          {/* Circular Red Printer Badge */}
          <div className="w-12 h-12 bg-white border-[2.5px] border-[#3b82f6] rounded-full flex items-center justify-center shadow-[2px_2px_0px_#000] overflow-hidden transform transition-transform group-hover:scale-105 active:translate-y-0.5 shrink-0">
            <img src={logo3D} alt="AD PRINT 3D Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <span className="block font-sans text-xl font-black tracking-tight text-black leading-none uppercase">
              AD PRINT <span className="text-[#3b82f6]">3D</span>
            </span>
          </div>
        </button>

        {/* Navigation Tabs - Brutalist Buttons */}
        <nav className="hidden md:flex items-center gap-3">
          <button
            id="nav-tab-shoppe"
            onClick={() => setTab('shoppe')}
            className={`px-4 py-2 border-[2.5px] border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] flex items-center gap-1.5 ${
              currentTab === 'shoppe' 
                ? 'bg-[#fcd34d] text-black' 
                : 'bg-white text-black hover:bg-slate-50'
            }`}
          >
            <span>🧭</span>
            Catálogo
          </button>
          
          <button
            id="nav-tab-box-builder"
            onClick={() => setTab('box-builder')}
            className={`px-4 py-2 border-[2.5px] border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] flex items-center gap-1.5 ${
              currentTab === 'box-builder' 
                ? 'bg-[#fcd34d] text-black' 
                : 'bg-white text-black hover:bg-slate-50'
            }`}
          >
            <span>🧩</span>
            Monte sua Box
          </button>
          
          <button
            id="nav-tab-about"
            onClick={() => setTab('about')}
            className={`px-4 py-2 border-[2.5px] border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] flex items-center gap-1.5 ${
              currentTab === 'about'
                ? 'bg-[#fcd34d] text-black' 
                : 'bg-white text-black hover:bg-slate-50'
            }`}
          >
            <span>🛡️</span>
            Sobre Nós &amp; Social
          </button>

          <button
            id="nav-tab-orders"
            onClick={() => setTab('orders')}
            className={`px-4 py-2 border-[2.5px] border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] ${
              currentTab === 'orders'
                ? 'bg-[#fcd34d] text-black' 
                : 'bg-white text-black hover:bg-slate-50'
            }`}
          >
            Rastrear
          </button>

          <button
            id="nav-tab-admin"
            onClick={() => setTab('admin')}
            className={`px-4 py-2 border-[2.5px] border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'bg-[#4ade80] text-black' 
                : 'bg-white text-black hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </button>
        </nav>

        {/* Right Info and Sacola - Brutalist details */}
        <div className="flex items-center gap-3">


          {/* Sacola Button */}
          <button
            id="cart-trigger-btn"
            onClick={onOpenCart}
            className="px-4 py-2.5 bg-[#fcd34d] border-[2.5px] border-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4 text-black" />
            <span>Sacola</span>
            {cartCount > 0 && (
              <span className="ml-1 bg-black text-white px-2 py-0.5 rounded-full text-[9px] font-black leading-none min-w-[16px] text-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Header */}
      <div className="flex md:hidden items-center justify-around border-t-2 border-black bg-[#faf6e8] py-2 mt-3 shadow-inner">
        <button
          id="mob-nav-shoppe"
          onClick={() => setTab('shoppe')}
          className={`flex flex-col items-center text-[9px] uppercase tracking-wider font-black ${currentTab === 'shoppe' ? 'text-black font-extrabold' : 'text-slate-600'}`}
        >
          <span className="text-base mb-0.5">🧭</span>
          Loja
        </button>
        <button
          id="mob-nav-box-builder"
          onClick={() => setTab('box-builder')}
          className={`flex flex-col items-center text-[9px] uppercase tracking-wider font-black ${currentTab === 'box-builder' ? 'text-black font-extrabold' : 'text-slate-600'}`}
        >
          <span className="text-base mb-0.5">🧩</span>
          Box
        </button>
        <button
          id="mob-nav-about"
          onClick={() => setTab('about')}
          className={`flex flex-col items-center text-[9px] uppercase tracking-wider font-black ${currentTab === 'about' ? 'text-black' : 'text-slate-600'}`}
        >
          <span className="text-base mb-0.5">🛡️</span>
          Sobre
        </button>
        <button
          id="mob-nav-orders"
          onClick={() => setTab('orders')}
          className={`flex flex-col items-center text-[9px] uppercase tracking-wider font-black ${currentTab === 'orders' ? 'text-black' : 'text-slate-600'}`}
        >
          <span className="text-base mb-0.5">📦</span>
          Rastrear
        </button>
        <button
          id="mob-nav-admin"
          onClick={() => setTab('admin')}
          className={`flex flex-col items-center text-[9px] uppercase tracking-wider font-black ${currentTab === 'admin' ? 'text-black' : 'text-slate-600'}`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          Admin
        </button>
      </div>
    </header>
  );
}
