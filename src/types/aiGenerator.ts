export interface AIGeneratedImage {
  id: string;
  url: string; // Base64 or external URL
  type: 'catalog' | 'lifestyle' | 'premium';
  label: string; // e.g., 'Studio Auto-Render', 'Foco Macro'
  cssFilter?: string;
  cssTransform?: string;
}

export type AdStatus = 
  | 'draft'               // Criado mas ainda recebendo ajustes
  | 'generating'          // Processando chamadas de IA
  | 'saved'               // Salvo no painel
  | 'published_local'     // Publicado na loja do site
  | 'published_ml'        // Publicado Mercado Livre
  | 'published_shopee'    // Publicado Shopee
  | 'archived';

export interface AIAdvertisement {
  id: string;
  baseProductName: string;
  baseImageUrl: string;
  
  // Imagens Geradas
  generatedImages: AIGeneratedImage[];
  
  // Estrutura de SEO e Copy
  seoTitles: string[];
  smartTags: string[];
  persuasiveDescription: string;
  seoDescription: string;
  
  // Parâmetros Físicos / Venda
  price: number;
  stock: number;
  category: string;
  sku?: string;
  
  // Ciclo de vida
  status: AdStatus;
  createdAt: string;
  updatedAt: string;
  
  // Integrations track
  integrations: {
    mercadoLivreId?: string;
    shopeeId?: string;
  }
}
