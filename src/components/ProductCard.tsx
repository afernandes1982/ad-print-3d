/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingCart, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const FILAMENT_COLORS = [
  { name: 'Roxo Galáxia', hex: '#a855f7' },
  { name: 'Preto Carbono', hex: '#1e293b' },
  { name: 'Preto Magma', hex: '#0f172a' },
  { name: 'Azul Celeste', hex: '#3b82f6' },
  { name: 'Verde Esmeralda', hex: '#10b981' },
  { name: 'Vermelho Rubi', hex: '#ef4444' },
  { name: 'Ouro Silk', hex: '#fbbf24' },
  { name: 'Rosa Choque', hex: '#db2777' },
  { name: 'Cobre Metálico', hex: '#b45309' },
  { name: 'Prata Platinado', hex: '#cbd5e1' },
];

function getProductBaseFilamentColor(product: Product): string {
  if (product.baseColor) {
    return product.baseColor;
  }
  
  const nameLower = product.name.toLowerCase();
  
  if (nameLower.includes('polvo') || nameLower.includes('octopus')) {
    return 'Azul Celeste';
  }
  if (nameLower.includes('dino') || nameLower.includes('t-rex') || nameLower.includes('rex')) {
    return 'Vermelho Rubi';
  }
  if (nameLower.includes('estrela') || nameLower.includes('stelina') || nameLower.includes('suave')) {
    return 'Ouro Silk';
  }
  
  return 'Roxo Galáxia';
}

function getProductFilter(product: Product, colorName: string): string {
  const baseColorName = getProductBaseFilamentColor(product);
  
  if (colorName === 'Preto Carbono') {
    return 'grayscale(1) brightness(0.4) contrast(1.35)';
  }
  
  if (colorName === 'Preto Magma') {
    return 'grayscale(1) brightness(0.18) contrast(1.4)';
  }

  if (colorName === 'Prata Platinado') {
    return 'grayscale(1) brightness(1.25) contrast(1.1)';
  }

  if (colorName === baseColorName) {
    // If the selected filament color matches the product's base image color,
    // we return '' (no filter) to show the original high-resolution photo with zero distortion!
    return '';
  }
  
  // Standard typical hues
  const HUES: { [key: string]: number } = {
    'Vermelho Rubi': 355,
    'Ouro Silk': 45,
    'Verde Esmeralda': 120,
    'Azul Celeste': 205,
    'Roxo Galáxia': 275,
    'Rosa Choque': 325,
    'Cobre Metálico': 25,
  };
  
  const baseHue = HUES[baseColorName] || 275;
  const targetHue = HUES[colorName] || 275;
  
  let deltaHue = targetHue - baseHue;
  
  // Fine-tuned visual enhancements based on chosen filament color target
  let sat = 1.25;
  let bright = 1.0;
  let cont = 1.0;
  
  if (colorName === 'Ouro Silk') {
    sat = 1.45;
    bright = 1.15;
    cont = 1.02;
  } else if (colorName === 'Vermelho Rubi') {
    sat = 1.4;
    bright = 0.95;
  } else if (colorName === 'Verde Esmeralda') {
    sat = 1.35;
    bright = 0.95;
  } else if (colorName === 'Azul Celeste') {
    sat = 1.4;
    bright = 0.98;
  } else if (colorName === 'Rosa Choque') {
    sat = 1.5;
    bright = 1.0;
  } else if (colorName === 'Cobre Metálico') {
    sat = 1.2;
    bright = 0.9;
  }
  
  return `hue-rotate(${deltaHue}deg) saturate(${sat}) brightness(${bright}) contrast(${cont})`;
}

export function PulsePadInteractive({ color }: { color: { name: string; hex: string } }) {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});

  const playClickSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio autoplay or context block bypass
    }
  };

  const handlePress = (key: string) => {
    setPressed(prev => ({ ...prev, [key]: !prev[key] }));
    playClickSound();
  };

  const leftColorHex = color.hex;

  const getRightColor = (leftName: string) => {
    switch (leftName) {
      case 'Roxo Galáxia':
        return { name: 'Ouro Silk', hex: '#fbbf24' };
      case 'Preto Carbono':
        return { name: 'Verde Esmeralda', hex: '#10b981' };
      case 'Preto Magma':
        return { name: 'Vermelho Rubi', hex: '#ef4444' };
      case 'Azul Celeste':
        return { name: 'Ouro Silk', hex: '#fbbf24' };
      case 'Verde Esmeralda':
        return { name: 'Roxo Galáxia', hex: '#a855f7' };
      case 'Vermelho Rubi':
        return { name: 'Azul Celeste', hex: '#3b82f6' };
      case 'Ouro Silk':
        return { name: 'Vermelho Rubi', hex: '#ef4444' };
      case 'Rosa Choque':
        return { name: 'Azul Celeste', hex: '#3b82f6' };
      case 'Cobre Metálico':
        return { name: 'Preto Carbono', hex: '#1e293b' };
      case 'Prata Platinado':
        return { name: 'Preto Magma', hex: '#0f172a' };
      default:
        return { name: 'Vermelho Rubi', hex: '#ef4444' };
    }
  };

  const rightColor = getRightColor(color.name);
  const rightColorHex = rightColor.hex;
  const rightColorName = rightColor.name;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 rounded-2xl overflow-hidden bg-slate-50/25">
      {/* Wave pulse ripples */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
        <div className="w-48 h-48 rounded-full border-2 border-slate-500 animate-ping" />
        <div className="w-32 h-32 rounded-full border border-slate-400 animate-pulse" />
      </div>

      <div className="relative flex items-center justify-center h-48 w-full scale-100">
        {/* Left Plate (Selected Color) */}
        <div 
          className="absolute left-[8%] top-[12%] w-[42%] aspect-square rounded-[20px] shadow-lg border-b-4 border-r-1 flex flex-col justify-between p-2 flex-wrap transition-all duration-500 hover:scale-105 group-hover:rotate-1 rotate-[-3deg]"
          style={{ 
            backgroundColor: leftColorHex,
            borderColor: `${leftColorHex}aa`,
            boxShadow: '0 8px 16px -8px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.4)',
          }}
        >
          <div className="grid grid-cols-3 gap-1.5 w-full h-full">
            {Array.from({ length: 9 }).map((_, i) => {
              const kp = `l-${i}`;
              const isPressed = pressed[kp];
              return (
                <button
                  key={kp}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePress(kp);
                  }}
                  className="aspect-square rounded-full transition-all duration-100 cursor-pointer relative"
                  style={{
                    backgroundColor: leftColorHex,
                    boxShadow: isPressed 
                      ? 'inset 0 3px 5px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.2)' 
                      : '0 3px 5px rgba(0,0,0,0.35), inset 0 1.5px 1.5px rgba(255,255,255,0.45), 0 2px 0px rgba(0,0,0,0.25)',
                    transform: isPressed ? 'translateY(2px) scale(0.92)' : 'translateY(0) scale(1)',
                  }}
                >
                  <span className="absolute inset-0.5 rounded-full border border-white/25 pointer-events-none opacity-40" />
                </button>
              );
            })}
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-mono font-bold text-slate-400 bg-slate-900/10 px-1 rounded uppercase tracking-wider">
            {color.name}
          </span>
        </div>

        {/* Right Plate (Contrast Duo: Red by default, Yellow if user chooses Red) */}
        <div 
          className="absolute right-[8%] top-[18%] w-[42%] aspect-square rounded-[20px] shadow-lg border-b-4 border-r-1 flex flex-col justify-between p-2 flex-wrap transition-all duration-500 hover:scale-105 group-hover:rotate-[-2deg] rotate-[5deg]"
          style={{ 
            backgroundColor: rightColorHex,
            borderColor: `${rightColorHex}aa`,
            boxShadow: '0 8px 16px -8px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.4)',
          }}
        >
          <div className="grid grid-cols-3 gap-1.5 w-full h-full">
            {Array.from({ length: 9 }).map((_, i) => {
              const kp = `r-${i}`;
              const isPressed = pressed[kp];
              return (
                <button
                  key={kp}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePress(kp);
                  }}
                  className="aspect-square rounded-full transition-all duration-100 cursor-pointer relative"
                  style={{
                    backgroundColor: rightColorHex,
                    boxShadow: isPressed 
                      ? 'inset 0 3px 5px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.2)' 
                      : '0 3px 5px rgba(0,0,0,0.35), inset 0 1.5px 1.5px rgba(255,255,255,0.45), 0 2px 0px rgba(0,0,0,0.25)',
                    transform: isPressed ? 'translateY(2px) scale(0.92)' : 'translateY(0) scale(1)',
                  }}
                >
                  <span className="absolute inset-0.5 rounded-full border border-white/25 pointer-events-none opacity-40" />
                </button>
              );
            })}
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-mono font-bold text-slate-400 bg-slate-900/10 px-1 rounded uppercase tracking-wider">
            {rightColorName}
          </span>
        </div>
      </div>
    </div>
  );
}

export function NexoCubeInteractive({ color }: { color: { name: string; hex: string } }) {
  const [activeSide, setActiveSide] = useState<'both' | 'left' | 'right'>('both');

  const playSnapSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Satisfying dual-tone plastic mechanical snap sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio autoplay bypass
    }
  };

  const handleNextFold = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSide(prev => {
      if (prev === 'both') return 'left';
      if (prev === 'left') return 'right';
      return 'both';
    });
    playSnapSound();
  };

  // Dynamically obtain the dual-color filament gradient endpoints for the silk 3D prints
  // Based on the user's color selection, so the illustration changes beautifully on the fly!
  const getDualColors = (colorName: string) => {
    switch (colorName) {
      case 'Roxo Galáxia':
        return {
          primaryLight: '#4f46e5', primaryDark: '#1e3a8a', // Silk Blue side
          secondaryLight: '#fb7185', secondaryDark: '#881337', // Silk Magenta side
          jointColor: '#64748b'
        };
      case 'Ouro Silk':
        return {
          primaryLight: '#fef08a', primaryDark: '#854d0e', // Silk Golden yellow
          secondaryLight: '#fda4af', secondaryDark: '#9f1239', // Silk Rose/Copper Gold
          jointColor: '#78716c'
        };
      case 'Vermelho Rubi':
        return {
          primaryLight: '#fca5a5', primaryDark: '#991b1b', // Ruby Red
          secondaryLight: '#fda4af', secondaryDark: '#9d174d', // Coral Magenta
          jointColor: '#52525b'
        };
      case 'Azul Celeste':
        return {
          primaryLight: '#93c5fd', primaryDark: '#1e40af', // Deep Royal Blue
          secondaryLight: '#99f6e4', secondaryDark: '#0f766e', // Teal mint cyan
          jointColor: '#475569'
        };
      case 'Verde Esmeralda':
        return {
          primaryLight: '#6ee7b7', primaryDark: '#065f46', // Emerald Green
          secondaryLight: '#fef08a', secondaryDark: '#78350f', // Golden-bronze highlights
          jointColor: '#3f3f46'
        };
      case 'Preto Carbono':
      default:
        return {
          primaryLight: '#94a3b8', primaryDark: '#1e293b', // Carbon slate dark
          secondaryLight: '#cbd5e1', secondaryDark: '#334155', // Metallic silver light
          jointColor: '#1e1b4b'
        };
    }
  };

  const currentTheme = getDualColors(color.name);

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden cursor-pointer group/nexo select-none bg-transparent"
      onClick={handleNextFold}
    >
      {/* Dynamic transparent interactive SVG illustration of the Infinite Cube (both states!) */}
      <svg 
        viewBox="0 0 420 280" 
        className="w-full h-full object-contain drop-shadow-md select-none transition-transform duration-300"
      >
        <defs>
          {/* Ground soft shadows for depth */}
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>

          {/* Primary Filament gradient with high metallic reflectivity representation */}
          <linearGradient id="primaryFilament" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.primaryLight} />
            <stop offset="30%" stopColor={currentTheme.primaryLight} />
            <stop offset="70%" stopColor={currentTheme.primaryDark} />
            <stop offset="100%" stopColor="#010413" stopOpacity="0.8" />
          </linearGradient>

          {/* Secondary Filament gradient for the dual-extrusion look */}
          <linearGradient id="secondaryFilament" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.secondaryLight} />
            <stop offset="25%" stopColor={currentTheme.secondaryLight} />
            <stop offset="75%" stopColor={currentTheme.secondaryDark} />
            <stop offset="100%" stopColor="#080004" stopOpacity="0.8" />
          </linearGradient>

          {/* Golden/Metallic highlight shine overlay */}
          <linearGradient id="highlightShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>

          {/* Hinge Link/Join Gradient */}
          <linearGradient id="hingeMetal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={currentTheme.jointColor} />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor={currentTheme.jointColor} />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        {/* Studio grounded drop-shadows under the objects */}
        <ellipse cx="140" cy="225" rx="85" ry="14" fill="url(#shadowGrad)" className="transition-all duration-300" style={{ opacity: activeSide === 'right' ? 0.3 : 1 }} />
        <ellipse cx="320" cy="235" rx="90" ry="16" fill="url(#shadowGrad)" className="transition-all duration-300" style={{ opacity: activeSide === 'left' ? 0.3 : 1 }} />

        {/* 1. LEFT CUBE: Folded 2x2 Slate configuration */}
        <g 
          className="transition-all duration-500 ease-in-out" 
          style={{ 
            opacity: activeSide === 'right' ? 0.2 : 1,
            transform: `translate(${activeSide === 'left' ? '35px, 5px' : '0px, 0px'}) scale(${activeSide === 'left' ? 1.15 : 1})`,
            transformOrigin: '140px 140px'
          }}
        >
          {/* Blue/Primary Front block */}
          <g>
            {/* Top bevel structure */}
            <path d="M 60,140 L 105,120 L 150,140 L 105,160 Z" fill="url(#primaryFilament)" />
            <path d="M 60,140 L 105,120 L 150,140 L 105,160 Z" fill="url(#highlightShine)" />
            {/* Front-Left shiny facet */}
            <path d="M 60,140 L 105,160 L 105,200 L 60,180 Z" fill="url(#primaryFilament)" />
            {/* Front-Right shiny facet with simulated specular edge */}
            <path d="M 105,160 L 150,140 L 150,180 L 105,200 Z" fill="url(#primaryFilament)" opacity="0.9" />
            
            {/* Subtle chamfer highlight lines matching the pristine beveled design */}
            <polyline points="60,140 105,160 150,140" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
            <polyline points="105,160 105,200" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />
          </g>

          {/* Another Blue/Primary block on the upper layer/left */}
          <g transform="translate(45, -20)">
            <path d="M 60,140 L 105,120 L 150,140 L 105,160 Z" fill="url(#primaryFilament)" />
            <path d="M 60,140 L 105,120 L 150,140 L 105,160 Z" fill="url(#highlightShine)" />
            <path d="M 60,140 L 105,160 L 105,200 L 60,180 Z" fill="url(#primaryFilament)" />
            <path d="M 105,160 L 150,140 L 150,180 L 105,200 Z" fill="url(#primaryFilament)" opacity="0.9" />
            <polyline points="60,140 105,160 150,140" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
          </g>

          {/* Pink/Secondary Right block (Dual filament contrast) */}
          <g transform="translate(68, 5)">
            {/* Top facet */}
            <path d="M 100,125 L 140,105 L 180,125 L 140,145 Z" fill="url(#secondaryFilament)" />
            <path d="M 100,125 L 140,105 L 180,125 L 140,145 Z" fill="url(#highlightShine)" />
            {/* Front-Left facet */}
            <path d="M 100,125 L 140,145 L 140,185 L 100,165 Z" fill="url(#secondaryFilament)" />
            {/* Front-Right facet */}
            <path d="M 140,145 L 180,125 L 180,165 L 140,185 Z" fill="url(#secondaryFilament)" opacity="0.9" />
            <polyline points="100,125 140,145 180,125" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
            <polyline points="140,145 140,185" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />
          </g>

          {/* Upper Pink/Secondary block */}
          <g transform="translate(108, -15)">
            <path d="M 100,125 L 140,105 L 180,125 L 140,145 Z" fill="url(#secondaryFilament)" />
            <path d="M 100,125 L 140,105 L 180,125 L 140,145 Z" fill="url(#highlightShine)" />
            <path d="M 100,125 L 140,145 L 140,185 L 100,165 Z" fill="url(#secondaryFilament)" />
            <path d="M 140,145 L 180,125 L 180,165 L 140,185 Z" fill="url(#secondaryFilament)" opacity="0.9" />
            <polyline points="100,125 140,145 180,125" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" />
          </g>
        </g>

        {/* 2. RIGHT CUBE: Unfolded chain configuration snake */}
        <g 
          className="transition-all duration-500 ease-in-out" 
          style={{ 
            opacity: activeSide === 'left' ? 0.2 : 1,
            transform: `translate(${activeSide === 'right' ? '-45px, 0px' : '0px, 0px'}) scale(${activeSide === 'right' ? 1.15 : 1})`,
            transformOrigin: '320px 140px'
          }}
        >
          {/* Segment A - Blue (bottom left of chain) */}
          <g transform="translate(180, 80)">
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#primaryFilament)" />
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#highlightShine)" />
            <path d="M 40,80 L 70,95 L 70,125 L 40,110 Z" fill="url(#primaryFilament)" />
            <path d="M 70,95 L 100,80 L 100,110 L 70,125 Z" fill="url(#primaryFilament)" opacity="0.9" />
            <polyline points="40,80 70,95 100,80" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
          </g>

          {/* Metal Joint Link Hinge 1 */}
          <rect x="268" y="160" width="12" height="15" rx="3" fill="url(#hingeMetal)" transform="rotate(-15, 268, 160)" stroke="#1e293b" strokeWidth="0.5" />

          {/* Segment B - Pink/Magenta */}
          <g transform="translate(225, 55)">
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#secondaryFilament)" />
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#highlightShine)" />
            <path d="M 40,80 L 70,95 L 70,125 L 40,110 Z" fill="url(#secondaryFilament)" />
            <path d="M 70,95 L 100,80 L 100,110 L 70,125 Z" fill="url(#secondaryFilament)" opacity="0.9" />
            <polyline points="40,80 70,95 100,80" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
          </g>

          {/* Metal Joint Link Hinge 2 */}
          <rect x="312" y="132" width="12" height="15" rx="3" fill="url(#hingeMetal)" transform="rotate(10, 312, 132)" stroke="#1e293b" strokeWidth="0.5" />

          {/* Segment C - Blue */}
          <g transform="translate(268, 32)">
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#primaryFilament)" />
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#highlightShine)" />
            <path d="M 40,80 L 70,95 L 70,125 L 40,110 Z" fill="url(#primaryFilament)" />
            <path d="M 70,95 L 100,80 L 100,110 L 70,125 Z" fill="url(#primaryFilament)" opacity="0.9" />
            <polyline points="40,80 70,95 100,80" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
          </g>

          {/* Metal Joint Link Hinge 3 */}
          <rect x="358" y="112" width="10" height="14" rx="3" fill="url(#hingeMetal)" transform="rotate(35, 358, 112)" stroke="#1e293b" strokeWidth="0.5" />

          {/* Segment D - Pink/Magenta (angled/floating end cap) */}
          <g transform="translate(320, 15) rotate(15, 70, 95)">
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#secondaryFilament)" />
            <path d="M 40,80 L 70,65 L 100,80 L 70,95 Z" fill="url(#highlightShine)" />
            <path d="M 40,80 L 70,95 L 70,125 L 40,110 Z" fill="url(#secondaryFilament)" />
            <path d="M 70,95 L 100,80 L 100,110 L 70,125 Z" fill="url(#secondaryFilament)" opacity="0.9" />
            <polyline points="40,80 70,95 100,80" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" />
          </g>
        </g>
      </svg>

      {/* Control Overlay informing them of the view mode */}
      <div className="absolute bottom-2 left-1/4 right-1/4 flex flex-col items-center justify-center pointer-events-none">
        <div className="rounded-full bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1 text-[8px] font-mono font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          Modo: {activeSide === 'both' ? 'Ver Ambos' : activeSide === 'left' ? 'Cubo Dobrado (2x2)' : 'Corrente Aberta'}
        </div>
        <span className="text-[7.5px] text-slate-400 mt-1 uppercase font-mono tracking-wide font-black select-none group-hover/nexo:text-teal-400 transition-colors">
          Toque para alternar foco!
        </span>
      </div>
    </div>
  );
}

export function EstrelaEspiralInteractive({ color }: { color: { name: string; hex: string } }) {
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState(0.007);
  const [spinBoost, setSpinBoost] = useState(0);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      setRotation(prev => prev + speed * (1 + spinBoost));
      if (spinBoost > 0) {
        setSpinBoost(prev => Math.max(0, prev - 0.08));
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [speed, spinBoost]);

  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpinBoost(16);
    playSpinSound();
  };

  const playSpinSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.35);
      
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay bypass
    }
  };

  const getDualColors = (colorName: string) => {
    switch (colorName) {
      case 'Roxo Galáxia':
        return { primary: '#a855f7', secondary: '#ec4899', accent: '#3b82f6', border: '#a855f7' };
      case 'Ouro Silk':
        return { primary: '#eab308', secondary: '#f97316', accent: '#ef4444', border: '#eab308' };
      case 'Vermelho Rubi':
        return { primary: '#ef4444', secondary: '#fb923c', accent: '#f43f5e', border: '#ef4444' };
      case 'Azul Celeste':
        return { primary: '#3b82f6', secondary: '#06b6d4', accent: '#2563eb', border: '#3b82f6' };
      case 'Verde Esmeralda':
        return { primary: '#10b981', secondary: '#eab308', accent: '#059669', border: '#10b981' };
      case 'Preto Magma':
        return { primary: '#111827', secondary: '#1e293b', accent: '#f97316', border: '#ea580c' }; // Orange borders, black base
      case 'Preto Carbono':
      default:
        return { primary: '#334155', secondary: '#475569', accent: '#cbd5e1', border: '#334155' };
    }
  };

  const palette = getDualColors(color.name);

  const NUM_LAYERS = 14;
  const PEAKS = 12;

  // Build the layered star paths
  const layers = Array.from({ length: NUM_LAYERS }).map((_, i) => {
    const R = 95 - i * 5.2;
    const r = 70 - i * 4.2;
    const translateY = -i * 3.8;
    // Spiral twist angle
    const offsetAngle = i * (13.5 * Math.PI / 180);
    
    const points: string[] = [];
    for (let k = 0; k < 2 * PEAKS; k++) {
      const isOuter = k % 2 === 0;
      const rad = isOuter ? R : r;
      const theta = (k * Math.PI / PEAKS) + offsetAngle + rotation;
      const x = 210 + rad * Math.cos(theta);
      const y = 145 + rad * Math.sin(theta) * 0.48 + translateY;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const d = `M ${points.join(' L ')} Z`;
    
    // Choose color of slice: gradient from primary to secondary / accent based on layer ratio
    const ratio = i / NUM_LAYERS;
    const isEven = i % 2 === 0;
    
    // For Magma (or any custom style), we might want a dark gradient but colored borders.
    // Ensure the ID is unique so it doesn't clash with other ProductCards!
    const fillGradId = `espiralGrad-${color.name.replace(/\s+/g, '')}-${i}`;
    
    return {
      id: fillGradId,
      d,
      ratio,
      isEven,
      primaryColor: isEven ? palette.primary : palette.secondary,
      secondaryColor: isEven ? palette.accent : palette.primary,
      borderColor: palette.border,
      translateY,
      R
    };
  });

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden cursor-pointer group/espiral select-none bg-transparent"
      onClick={handleInteractiveClick}
    >
      <svg 
        viewBox="0 0 420 280" 
        className="w-full h-full object-contain drop-shadow-lg select-none transition-transform duration-300"
      >
        <defs>
          <radialGradient id="espiralShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>

          {/* Golden highlight shine */}
          <linearGradient id="rodShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="40%" stopColor={palette.secondary} />
            <stop offset="85%" stopColor={palette.primary} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>

          {/* Dynamic gradients for each layer */}
          {layers.map(layer => (
            <linearGradient key={layer.id} id={layer.id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={layer.primaryColor} />
              <stop offset="50%" stopColor={layer.secondaryColor} />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.65" />
            </linearGradient>
          ))}
        </defs>

        {/* Soft floor shadow */}
        <ellipse cx="210" cy="240" rx="100" ry="16" fill="url(#espiralShadow)" className="transition-all duration-300" />

        {/* Outer Circular spinning support platform with glassy feel just like image! */}
        <ellipse cx="210" cy="225" rx="110" ry="24" fill="none" stroke={color.hex} strokeWidth="2.5" strokeOpacity="0.15" />
        <ellipse cx="210" cy="225" rx="122" ry="28" fill="none" stroke={color.hex} strokeWidth="1.2" strokeOpacity="0.08" />

        {/* Draw layers of the spiral star, starting from bottom i=0 to top */}
        {layers.map((layer) => (
          <g key={layer.id}>
            {/* Draw layer geometry */}
            <path 
              d={layer.d} 
              fill={`url(#${layer.id})`}
              stroke={layer.borderColor}
              strokeWidth="0.8"
              strokeOpacity="0.75"
              className="transition-all duration-300"
            />
            {/* Soft highlight border representing the 3D-extruder perimeter ridges */}
            <path 
              d={layer.d} 
              fill="none" 
              stroke={layer.borderColor} 
              strokeWidth="1.2" 
              strokeOpacity={0.6 - layer.ratio * 0.25} 
            />
          </g>
        ))}

        {/* Vertical alignment rod/axle from top passing down through the helix centerpiece */}
        <g>
          {/* Base of the rod */}
          <ellipse cx="210" cy="145" rx="4.5" ry="2" fill="#020617" opacity="0.4" />
          {/* Shaft cylinder */}
          <rect 
            x="207.5" 
            y="25" 
            width="5" 
            height="115" 
            rx="2.5" 
            fill="url(#rodShine)" 
            stroke={palette.primary} 
            strokeWidth="0.5" 
            strokeOpacity="0.4" 
          />
          {/* Rounded shiny top cap */}
          <ellipse cx="210" cy="25" rx="2.5" ry="1.2" fill="#ffffff" opacity="0.8" />
        </g>
      </svg>

      {/* Control Overlay */}
      <div className="absolute bottom-2 left-1/4 right-1/4 flex flex-col items-center justify-center pointer-events-none">
        <div className="rounded-full bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1 text-[8px] font-mono font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <span className={`h-1.5 w-1.5 rounded-full bg-teal-400 ${spinBoost > 0 ? 'animate-ping' : 'animate-pulse'}`} />
          Cinético: {spinBoost > 3 ? 'Giro Rápido!' : 'Equilíbrio Contínuo'}
        </div>
        <span className="text-[7.5px] text-slate-400 mt-1 uppercase font-mono tracking-wide font-black select-none group-hover/espiral:text-teal-400 transition-colors">
          Toque para impulsionar giro!
        </span>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedColor?: string) => void;
  cartQuantity: number;
  key?: React.Key | string | number;
}

export default function ProductCard({ product, onAddToCart, cartQuantity }: ProductCardProps) {
  const baseColorName = getProductBaseFilamentColor(product);
  const initialColor = FILAMENT_COLORS.find(c => c.name === baseColorName) || FILAMENT_COLORS[0];
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hexVal = selectedColor.hex.replace('#', '');
  const rIdx = parseInt(hexVal.slice(0, 2), 16) / 255;
  const gIdx = parseInt(hexVal.slice(2, 4), 16) / 255;
  const bIdx = parseInt(hexVal.slice(4, 6), 16) / 255;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border-2 border-slate-100 hover:border-teal-400 hover:shadow-xl transition-all duration-300"
    >
      {/* Badges container */}
      <div className="absolute left-3 top-3 z-10 flex flex-row gap-1.5 items-center">
        {/* Brand/Category Tag */}
        <span className="rounded-full bg-slate-100/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200 uppercase tracking-wider">
          {product.category}
        </span>
        
        {/* Popular/Badge Tag */}
        {product.isPopular && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-[9px] font-bold text-orange-600 uppercase tracking-wider">
            <Activity className="w-3 h-3 text-orange-500 animate-pulse" /> Popular
          </span>
        )}
      </div>

      {/* Stock status indicator */}
      {product.stock <= 5 ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[9px] font-bold text-red-600 capitalize">
          Poucas Unidades
        </span>
      ) : (
        <span className="absolute right-3 top-3 z-10 text-[10px] font-bold text-slate-400">
          Estoque: {product.stock}
        </span>
      )}

      {/* 3D Toy Image representation area with Zoom and subtle Filament Color Selector */}
      <div className="relative flex h-64 w-full items-center justify-center bg-white border-b border-slate-100 overflow-hidden group-hover:bg-teal-50/10 transition-all duration-300">
        <div className="w-full h-full flex items-center justify-center select-none overflow-hidden transition-transform duration-500 group-hover:scale-110 p-2 relative">
          {product.imageUrl === 'pulse-pad' ? (
            <PulsePadInteractive color={selectedColor} />
          ) : product.imageUrl === 'nexo-cube' ? (
            <NexoCubeInteractive color={selectedColor} />
          ) : product.imageUrl === 'estrela-espiral' ? (
            <EstrelaEspiralInteractive color={selectedColor} />
          ) : product.aiImages && product.aiImages.length > 0 ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
              <img 
                src={product.aiImages[currentImageIndex].url} 
                alt={product.name} 
                className="h-full w-full object-contain select-none transition-all duration-500 ease-out group-hover:scale-115" 
                style={{ 
                  filter: product.aiImages[currentImageIndex].cssFilter,
                  transform: product.aiImages[currentImageIndex].cssTransform
                }}
                referrerPolicy="no-referrer" 
              />
              
              {/* Carousel Controls */}
              {product.aiImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : product.aiImages!.length - 1)); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur hover:bg-white text-slate-700 p-1.5 rounded-full shadow-md transition-colors z-20 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < product.aiImages!.length - 1 ? prev + 1 : 0)); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur hover:bg-white text-slate-700 p-1.5 rounded-full shadow-md transition-colors z-20 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {product.aiImages.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentImageIndex ? 'bg-teal-500 w-4' : 'bg-slate-300 hover:bg-slate-400'}`}
                        title={`Ver imagem ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : product.imageUrl && (product.imageUrl.startsWith('http://') || product.imageUrl.startsWith('https://') || product.imageUrl.startsWith('/') || product.imageUrl.startsWith('data:')) ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-full w-full object-contain select-none transition-all duration-500 ease-out group-hover:scale-115" 
                referrerPolicy="no-referrer" 
              />
            </div>
          ) : (
            <div 
              className="text-6xl select-none transition-all duration-500"
              style={{ filter: getProductFilter(product, selectedColor.name) }}
            >
              {product.imageUrl || '📦'}
            </div>
          )}
        </div>


      </div>

      {/* Content description panel */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-sans font-black text-slate-900 text-base leading-tight group-hover:text-teal-600 transition-colors">
            {product.name}
          </h3>
          <p className="mt-2 text-slate-600 text-xs leading-relaxed line-clamp-2">
            {product.description}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <div className="text-[10px] text-slate-500">
              <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Material</span>
              <span className="font-sans font-extrabold text-slate-700 line-clamp-1">{product.material}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider font-sans">Dimensões</span>
              <span className="font-sans font-extrabold text-slate-700 line-clamp-1">{product.size}</span>
            </div>
          </div>
        </div>

        {/* Pricing tag and Add to Cart Button */}
        <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div>
            <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Preço</span>
            <span className="font-sans text-teal-600 font-black text-xl">
              R$ {product.price.toFixed(2)}
            </span>
          </div>

          <button
            id={`add-to-cart-btn-${product.id}`}
            onClick={() => onAddToCart(product, selectedColor.name)}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 text-white font-sans font-black text-[10px] uppercase tracking-wider shadow-lg shadow-orange-100 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> 
            {cartQuantity > 0 ? (
              <span>Carrinho ({cartQuantity})</span>
            ) : (
              <span>Comprar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
