/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number; // IVA included, in euros
  category: 'tapas' | 'bocadillos' | 'bebidas' | 'postres';
  description: string;
  iconName: string; // Lucide icon identifier
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string; // e.g., "FAC-2026-001" (Factura Simplificada)
  ticketNumber: string;
  timestamp: string; // ISO string
  items: {
    productId: string;
    name: string;
    price: number; // price at checkout
    quantity: number;
    total: number;
  }[];
  baseImponible: number; // subtotal without 10% IVA
  ivaAmount: number; // 10% of baseImponible
  total: number;
  metodoPago: 'Efectivo' | 'Tarjeta';
  mesa?: string; // e.g., "Mesa 3", "Barra", "Terraza 2"
}

export interface SalesSummary {
  totalSales: number;
  totalBase: number;
  totalIva: number;
  efectivoCount: number;
  tarjetaCount: number;
  itemsSold: { [name: string]: number };
}

export interface CashRegisterClose {
  id: string;
  timestamp: string;
  expectedCash: number;
  actualCash: number;
  expectedCard: number;
  gap: number; // actualCash - expectedCash
  totalSales: number;
  totalIva: number;
  ticketCount: number;
  zReportNumber: string;
}

