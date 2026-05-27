/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem('ad_print_3d_admin_token', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Senha incorreta. Tente novamente.');
        setPassword('');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6e8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl shadow-[4px_4px_0px_#fcd34d] mb-4">
            <Lock className="w-8 h-8 text-[#fcd34d]" />
          </div>
          <h1 className="font-sans font-black text-2xl uppercase tracking-tight text-black">
            Área Administrativa
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
            AD PRINT 3D — Acesso Restrito
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white border-3 border-black rounded-3xl p-8 shadow-[6px_6px_0px_#000]">

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[11px] font-bold text-amber-700 leading-snug">
              Esta área é restrita ao proprietário da loja. Digite a senha de administrador para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Senha de Administrador
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Digite a senha..."
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 border-2 border-black rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black bg-slate-50 text-black placeholder-slate-400 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-red-600">⚠️ {error}</p>
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3.5 bg-black text-[#fcd34d] border-2 border-black rounded-xl text-sm font-black uppercase tracking-wider shadow-[3px_3px_0px_#fcd34d] hover:shadow-[1px_1px_0px_#fcd34d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#fcd34d] border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Entrar no Painel Admin
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-6">
            Esqueceu a senha? Configure a variável <code className="bg-slate-100 px-1 rounded">ADMIN_PASSWORD</code> no EasyPanel.
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          <a href="/" className="hover:text-black transition-colors font-bold uppercase tracking-wider">
            ← Voltar para a loja
          </a>
        </p>
      </div>
    </div>
  );
}
