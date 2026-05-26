import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, ChevronLeft, ChevronRight, Share, Save, ShoppingBag, Bookmark, Search, ExternalLink, Trash, Copy, Globe, Check, AlertTriangle } from 'lucide-react';
import { AIAdvertisement } from '../../types/aiGenerator';
import { Product } from '../../types';

interface AIGeneratorStudioProps {
  onAddProduct?: (product: Product) => void;
}

import { cleanPngCheckersAndSetWhite } from '../../utils/imageCleaner';

export default function AIGeneratorStudio({ onAddProduct }: AIGeneratorStudioProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'anuncios' | 'integracoes'>('dashboard');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [productName, setProductName] = useState('');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<AIAdvertisement | null>(null);
  const [savedAds, setSavedAds] = useState<AIAdvertisement[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ai_saved_ads');
    if (saved) {
      try {
        setSavedAds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveAd = (ad: AIAdvertisement) => {
    const updatedAds = [ad, ...savedAds];
    setSavedAds(updatedAds);
    localStorage.setItem('ai_saved_ads', JSON.stringify(updatedAds));
    showToast('Anúncio salvo com sucesso!');
  };

  const handleDeleteSavedAd = (id: string) => {
    const updatedAds = savedAds.filter(a => a.id !== id);
    setSavedAds(updatedAds);
    localStorage.setItem('ai_saved_ads', JSON.stringify(updatedAds));
    showToast('Anúncio excluído!', 'info');
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          const transparentImage = await cleanPngCheckersAndSetWhite(result);
          setBaseImage(transparentImage);
        } catch (e) {
          setBaseImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // TODO: Connect to AI / Backend logic here
    setTimeout(() => {
      setGeneratedAd({
        id: '1',
        baseProductName: productName || 'Ovo de Dragão',
        baseImageUrl: baseImage || '',
        generatedImages: [
          { id: 'img1', url: baseImage || 'https://images.unsplash.com/photo-1631541909061-71e34ddce158?auto=format&fit=crop&q=80&w=800', type: 'catalog', label: 'Studio Auto-Render', cssFilter: 'contrast(1.05) saturate(1.1)', cssTransform: 'scale(1)' },
          { id: 'img2', url: baseImage || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800', type: 'lifestyle', label: 'Lifestyle / Decor (Variação de Cor)', cssFilter: 'hue-rotate(140deg) saturate(1.2) contrast(1.1)', cssTransform: 'scale(1.05)' },
          { id: 'img3', url: baseImage || 'https://images.unsplash.com/photo-1607513746994-6c3dc9403ec9?auto=format&fit=crop&q=80&w=800', type: 'premium', label: 'Premium Macro (Zoom)', cssFilter: 'hue-rotate(280deg) saturate(1.3) contrast(1.15)', cssTransform: 'scale(1.5) translateY(5%)' }
        ],
        seoTitles: [productName + ' Articulado Fidget Toy Impressão 3D Premium'],
        smartTags: ['#Ovo de Dragão', '#Dragão Articulado 3D', '#Fidget Toy', '#Impressão 3D'],
        persuasiveDescription: 'Descubra a Magia com o ' + productName + ' Articulado!\n\nTransforme sua decoração ou alivie o estresse com esta obra de arte fascinante. Produzido pela AD Print 3D, especialista em impressão 3D de altíssima qualidade...',
        seoDescription: '',
        price: 0,
        stock: 0,
        category: '',
        status: 'generating',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        integrations: {}
      });
      setIsGenerating(false);
      // Dummy success state
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] min-h-[800px] text-slate-200 font-sans rounded-2xl overflow-hidden border border-slate-800">
      
      {/* Header / Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-tighter">
            AD
          </div>
          <div>
            <h1 className="font-black text-white text-lg tracking-tight uppercase leading-none">PRINT 3D</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Marketplace Generator</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeTab === 'dashboard' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('anuncios')}
              className={`text-sm font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeTab === 'anuncios' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
            >
              Anúncios
            </button>
            <button 
              onClick={() => setActiveTab('integracoes')}
              className={`text-sm font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeTab === 'integracoes' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
            >
              Integrações
            </button>
          </nav>

          <button 
            onClick={() => setActiveTab('dashboard')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Gerar Novo
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="flex h-full gap-6">
            
            {/* LEFT COLUMN: Input & SEO Specs */}
            <div className="flex flex-col gap-6 w-full max-w-sm shrink-0">
        
        {/* SOURCE FORM */}
        <div className="bg-[#131A2B] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-teal-400"></div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fonte do Produto</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold mb-1 block">Nome do Produto</label>
              <input 
                type="text" 
                placeholder="Ex: Ovo de Dragão 3D" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-slate-400 font-bold mb-1 block">Imagem Principal</label>
              <div className="relative border-2 border-dashed border-slate-700 bg-[#0B0F19] rounded-xl hover:border-indigo-500 transition-colors cursor-pointer flex flex-col items-center justify-center py-8 overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                {baseImage ? (
                  <img src={baseImage} alt="Base" className="absolute inset-0 w-full h-full object-contain" />
                ) : (
                  <>
                    <Upload size={20} className="text-slate-500 mb-2" />
                    <span className="text-xs text-slate-400 font-medium">Clique, arraste ou Ctrl+V</span>
                  </>
                )}
              </div>
            </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {isGenerating ? 'Gerando...' : 'Gerar Anúncio Profissional'}
                </button>
          </div>
        </div>

        {/* SEO SECTION (Visible after generation) */}
        {generatedAd && (
          <>
            <div className="bg-[#131A2B] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                Títulos SEO Sugeridos
                <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">OTIMIZADO</span>
              </h3>
              <div className="bg-[#0B0F19] border border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-300">
                {generatedAd.seoTitles[0]}
              </div>
            </div>

            <div className="bg-[#131A2B] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Smart Tags Marketplace</h3>
              <div className="flex flex-wrap gap-2">
                {generatedAd.smartTags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Studio Preview & Publishing */}
      <div className="flex-1 flex flex-col gap-6">
        {!generatedAd ? (
          <div className="flex-1 bg-[#131A2B] border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-10 border-dashed">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500">
              <Sparkles size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-300 mb-2">Aguardando envio.</h2>
            <p className="text-sm text-slate-500 max-w-sm">Preencha os dados ao lado e clique em gerar para criar o seu anúncio profissional completo.</p>
          </div>
        ) : (
          <>
            {/* Main Stage Grid */}
            <div className="flex-1 bg-[#131A2B] border border-slate-800 rounded-2xl p-4 flex flex-col relative overflow-hidden group">
               {/* 3D Render Image Dummy Placeholder */}
               <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                 {generatedAd.generatedImages.length > 0 ? (
                   <img 
                     src={generatedAd.generatedImages[selectedImageIdx].url} 
                     alt="Main render" 
                     className="w-full h-full object-contain transition-all duration-500 ease-in-out" 
                     style={{
                       filter: generatedAd.generatedImages[selectedImageIdx].cssFilter,
                       transform: generatedAd.generatedImages[selectedImageIdx].cssTransform
                     }}
                   />
                 ) : (
                   <span className="text-indigo-400/20 font-black text-4xl">PREVIEW AI RENDER</span>
                 )}
               </div>
               
               {/* Overlay Content */}
               <div className="relative z-10 flex justify-between h-full flex-col pointer-events-none">
                  <div className="flex justify-between items-start pointer-events-auto">
                    <div className="flex gap-2">
                      <span className="bg-[#131A2B]/80 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur shadow-sm">
                        IA Render ({selectedImageIdx + 1}/3)
                      </span>
                      <span className="bg-[#131A2B]/80 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur shadow-sm">
                        {generatedAd.generatedImages[selectedImageIdx].label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                       {generatedAd.generatedImages.map((img, idx) => (
                         <div 
                           key={img.id} 
                           onClick={() => setSelectedImageIdx(idx)}
                           className={`w-14 h-14 rounded-lg bg-white border-2 overflow-hidden cursor-pointer transition-colors shadow-lg ${idx === selectedImageIdx ? 'border-indigo-500' : 'border-slate-300 hover:border-slate-400'}`}
                         >
                           <img 
                             src={img.url} 
                             alt="thumb" 
                             className="w-full h-full object-cover" 
                             style={{
                               filter: img.cssFilter,
                               transform: img.cssTransform
                             }}
                           />
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="mt-auto flex justify-between items-end pointer-events-auto">
                    <div>
                      <h1 className="text-2xl font-black text-white drop-shadow-md">{generatedAd.seoTitles[0]}</h1>
                      <div className="mt-3 bg-black/50 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shadow-xl max-w-md">
                        <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Detalhe da Geração</p>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {generatedAd.generatedImages[selectedImageIdx].label} - Variação exclusiva gerada por IA a partir da imagem original, mantendo alta fidelidade com diferentes estilos de luz e enquadramento.
                        </p>
                      </div>
                    </div>
                    <button className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer shrink-0">
                      <Share size={20} />
                    </button>
                  </div>
               </div>
            </div>

            {/* Bottom Actions Grid */}
            <div className="grid grid-cols-2 gap-6 h-64">
               {/* Text Description Box */}
               <div className="bg-[#131A2B] border border-slate-800 rounded-2xl p-5 flex flex-col relative group">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição Persuasiva</h3>
                    <button className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors">
                       <Copy className="w-3 h-3" />
                       Copiar Tudo
                    </button>
                  </div>
                  <textarea 
                    className="flex-1 w-full bg-[#0B0F19] border border-slate-700 rounded-xl p-4 text-sm text-slate-300 resize-none focus:outline-none focus:border-indigo-500 custom-scrollbar"
                    defaultValue={generatedAd.persuasiveDescription}
                  />
               </div>

               {/* Publishing Box */}
               <div className="bg-[#131A2B] border border-slate-800 rounded-2xl p-5 flex flex-col justify-center">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Publicação Rápida</h3>
                  <div className="space-y-3">
                     <button 
                       onClick={() => showToast('Anúncio publicado no Mercado Livre com sucesso!')}
                       className="w-full bg-[#FFE600] hover:bg-[#F2DA00] text-[#2D3277] font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer"
                     >
                       <ShoppingBag size={16} /> Publicar no Mercado Livre
                    </button>
                    <button 
                      onClick={() => showToast('Anúncio publicado na Shopee com sucesso!')}
                      className="w-full bg-[#F53D2D] hover:bg-[#E5392A] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer"
                    >
                       <ShoppingBag size={16} /> Publicar na Shopee
                    </button>
                    <button 
                      onClick={() => {
                        if (onAddProduct) {
                          onAddProduct({
                            id: Date.now().toString(),
                            name: generatedAd.seoTitles[0] || generatedAd.baseProductName,
                            description: generatedAd.persuasiveDescription,
                            price: 99.90, // mock price
                            category: 'Articulados',
                            stock: 10,
                            imageUrl: generatedAd.generatedImages[0]?.url || 'https://images.unsplash.com/photo-1607513746994-6c3dc9403ec9?auto=format&fit=crop&q=80&w=800',
                            aiImages: generatedAd.generatedImages.map(img => ({ url: img.url, cssFilter: img.cssFilter, cssTransform: img.cssTransform })),
                            size: 'Padrão',
                            material: 'PLA Premium',
                            isKit: false
                          });
                        }
                        showToast('Anúncio publicado no Site com sucesso!');
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer"
                    >
                       <Globe size={16} /> Publicar no Site
                    </button>
                    <button 
                      onClick={() => handleSaveAd(generatedAd)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer"
                    >
                       <Save size={16} /> Salvar Anúncio
                    </button>
                    <p className="text-[9px] text-center text-slate-500 mt-2 flex items-center justify-center gap-1">
                      <Sparkles size={10} /> Layout em formato visual "Bento Grid"
                    </p>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
          </div>
        )}

        {activeTab === 'anuncios' && (
          <div className="space-y-6">
            <div className="bg-[#131A2B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-indigo-400" /> Meus Anúncios Salvos ({savedAds.length})
                </h2>
                <p className="text-xs text-slate-400 mt-1">Gerencie, visualize e recupere anúncios criados pela Inteligência Artificial para seus produtos 3D.</p>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Buscar pelo título ou tag..." 
                  className="pl-9 pr-4 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedAds.map((savedAd, i) => (
                <div key={savedAd.id + i} className="bg-[#131A2B] border border-slate-800 rounded-2xl overflow-hidden flex flex-col group">
                  <div className="relative h-48 flex items-center justify-center overflow-hidden bg-white border-b border-slate-800">
                    {savedAd.generatedImages && savedAd.generatedImages.length > 0 ? (
                      <img 
                        src={savedAd.generatedImages[0].url} 
                        className="w-full h-full object-contain p-4 opacity-90 group-hover:opacity-100 transition-transform group-hover:scale-105 duration-500"
                        style={{ filter: savedAd.generatedImages[0].cssFilter }}
                      />
                    ) : (
                      <span className="text-slate-400/50 font-black text-xl">AI RENDER</span>
                    )}
                    
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-slate-300 text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {new Date(savedAd.createdAt).toLocaleString()}
                    </div>
                    <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg">
                      IA RENDER
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">FONTE: {savedAd.baseProductName}</span>
                    <h3 className="text-sm font-bold text-white leading-snug mb-3 line-clamp-2">{savedAd.seoTitles?.[0]}</h3>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {savedAd.smartTags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-medium bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">{tag}</span>
                      ))}
                      {savedAd.smartTags && savedAd.smartTags.length > 3 && (
                        <span className="text-[9px] font-medium bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">+{savedAd.smartTags.length - 3}</span>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          setGeneratedAd(savedAd);
                          setActiveTab('dashboard');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                        <ExternalLink size={12} /> Visualizar
                      </button>
                      <button 
                        onClick={() => handleDeleteSavedAd(savedAd.id)}
                        className="bg-transparent hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                        <Trash size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {savedAds.length === 0 && (
                <div className="col-span-full py-12 flex flex-col justify-center items-center text-slate-500">
                  <Bookmark size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-bold">Nenhum anúncio salvo ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-700 mb-4" />
            <h2 className="text-lg font-bold text-slate-300">Integrações de Marketplace</h2>
            <p className="text-sm text-slate-500 max-w-md mt-2">Conecte suas contas do Mercado Livre e Shopee para publicar anúncios gerados pela Inteligência Artificial com 1 clique.</p>
          </div>
        )}
      </div>

      {/* Global Toast Component */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-teal-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-indigo-600 text-white'
        }`}>
          {toast.type === 'success' && <Check size={20} />}
          {toast.type === 'error' && <AlertTriangle size={20} />}
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
