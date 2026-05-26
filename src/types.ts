/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'Fidgets' | 'Articulados' | 'Sensoriais' | 'Kits' | 'Personalizados';
  imageUrl: string;
  images?: string[];
  aiImages?: { url: string; cssFilter?: string; cssTransform?: string; id?: string; type?: string; label?: string }[];
  stock: number;
  size: string;
  material: string;
  isKit: boolean;
  isPopular?: boolean;
  baseColor?: 'Roxo Galáxia' | 'Preto Carbono' | 'Preto Magma' | 'Azul Celeste' | 'Verde Esmeralda' | 'Vermelho Rubi' | 'Ouro Silk' | 'Rosa Choque' | 'Cobre Metálico' | 'Prata Platinado';
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  isBox?: boolean;
  boxItems?: string[];
  selectedColor?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  discount: number;
  shipping: number;
  paymentMethod: 'pix' | 'credit_card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'canceled';
  pixCode?: string;
  createdAt: string;
  deliveryMethod?: 'standard' | 'hand';
}

export interface SalesStat {
  month: string;
  sales: number;
}

export interface ECommerceSettings {
  pixKeyType: string;
  pixKeyCode: string;
  pixBeneficiary: string;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;
  whatsappNumber: string;
  freeShippingThreshold: number;
  instagramUrl: string;
  tiktokUrl: string;
  maintenanceMode: string; // 'Não' or 'Sim'
  heroTitle: string;
  heroSubtitle: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSubtotal: number;
  isActive: boolean;
}

