/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CartItem, KitchenOrder } from '../types';
import { formatEuro } from '../utils';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, UserRound, Users, ChefHat } from 'lucide-react';

interface CartSectionProps {
  cartItems: CartItem[];
  selectedMesa: string;
  setSelectedMesa: (mesa: string) => void;
  selectedPayment: 'Efectivo' | 'Tarjeta';
  setSelectedPayment: (method: 'Efectivo' | 'Tarjeta') => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProcessPayment: () => void;
  isProcessing: boolean;
  onSendToKitchen: (notes: string) => void;
  onOpenSplitModal: () => void;
  activeMesaComanda?: KitchenOrder;
  onLoadActiveMesaComanda?: (order: KitchenOrder) => void;
}

const ESPANA_TABLES = [
  'Barra 1',
  'Barra 2',
  'Mesa 1',
  'Mesa 2',
  'Mesa 3',
  'Mesa 4',
  'Terraza 1',
  'Terraza 2',
  'Para Llevar'
];

export default function CartSection({
  cartItems,
  selectedMesa,
  setSelectedMesa,
  selectedPayment,
  setSelectedPayment,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProcessPayment,
  isProcessing,
  onSendToKitchen,
  onOpenSplitModal,
  activeMesaComanda,
  onLoadActiveMesaComanda
}: CartSectionProps) {
  const [kitchenNotes, setKitchenNotes] = useState('');

  // calculate total with IVA included
  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Calculate Base Imponible (VAT 10% is included in product catalog for Spanish hospitality)
  // Base = Total / 1.10
  const baseImponible = Math.round((total / 1.10) * 100) / 100;
  
  // IVA quota is 10% of base, or Total minus Base
  const ivaCuota = Math.round((total - baseImponible) * 100) / 100;

  const handleSendToKitchen = () => {
    onSendToKitchen(kitchenNotes);
    setKitchenNotes('');
  };


  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-lg tracking-tight">Venta del Operador</h2>
        </div>
        {cartItems.length > 0 && (
          <button
            id="btn-clear-cart"
            onClick={onClearCart}
            className="text-xs text-rose-300 hover:text-rose-100 font-medium cursor-pointer transition-colors active:scale-95 px-2.5 py-1 rounded bg-rose-950/40 border border-rose-900/40"
          >
            Vaciar Caja
          </button>
        )}
      </div>

      {/* Select Table / Mesa */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <UserRound className="w-3.5 h-3.5" /> Selección de Mesa / Zona
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {ESPANA_TABLES.map((table) => {
            const isSelected = selectedMesa === table;
            return (
              <button
                key={table}
                id={`btn-table-${table.replace(/\s+/g, '-').toLowerCase()}`}
                type="button"
                onClick={() => setSelectedMesa(table)}
                className={`text-xs py-1.5 px-1 rounded-lg border font-medium transition-all text-center truncate cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {table}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 px-4 text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400 border border-slate-100">
              <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
            </div>
            <p className="font-medium text-slate-500 text-sm">El carrito está vacío</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Selecciona productos del menú de la izquierda para agregarlos al ticket.
            </p>

            {activeMesaComanda && (
              <div className="mt-5 p-3.5 border border-amber-200 bg-amber-50 rounded-xl max-w-[230px] shadow-3xs text-left">
                <span className="text-3xs font-extrabold text-amber-800 uppercase tracking-widest block mb-1">
                  💡 Comanda Detectada
                </span>
                <p className="text-4xs text-slate-500 font-medium mb-2.5 leading-normal">
                  Hay una comanda activa en cocina ({activeMesaComanda.ticketNumber}) para {selectedMesa}.
                </p>
                <button
                  id="btn-load-mesa-comanda"
                  type="button"
                  onClick={() => onLoadActiveMesaComanda && onLoadActiveMesaComanda(activeMesaComanda)}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-3xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cargar Comanda</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          cartItems.map((item) => {
            const itemTotal = item.product.price * item.quantity;
            return (
              <div
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-all group"
              >
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-slate-950 block truncate leading-snug">
                    {item.product.name}
                  </span>
                  <span className="text-xs text-slate-450 font-mono mt-0.5 block">
                    {formatEuro(item.product.price)} c/u
                  </span>
                </div>

                {/* Adjust Quantities */}
                <div className="flex items-center gap-1 shrink-0 bg-white/70 rounded-lg p-0.5 border border-slate-100">
                  <button
                    id={`btn-cart-decrease-${item.product.id}`}
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md cursor-pointer transition-colors active:scale-90"
                    title="Disminuir"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800 min-w-[24px] text-center font-mono">
                    {item.quantity}
                  </span>
                  <button
                    id={`btn-cart-increase-${item.product.id}`}
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md cursor-pointer transition-colors active:scale-90"
                    title="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Total and Trash */}
                <div className="flex items-center gap-2.5 shrink-0 text-right min-w-[80px] justify-end">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatEuro(itemTotal)}
                  </span>
                  <button
                    id={`btn-cart-delete-${item.product.id}`}
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                    title="Eliminar artículo"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Breakdown & Formats */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3.5 shrink-0">
        {/* Desglose de Factura Simplificada compliant with Spain laws */}
        <div className="space-y-1.5 text-xs text-slate-600 font-sans border-b border-slate-200/80 pb-3">
          <div className="flex justify-between">
            <span className="text-slate-550">Base Imponible (S. Neto):</span>
            <span className="font-mono font-medium">{formatEuro(cartItems.length > 0 ? baseImponible : 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1.5 text-slate-550">
              <span>Cuota IVA (10% Hostelería):</span>
              <span className="bg-slate-200/80 text-slate-600 px-1 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider">
                Régimen General Reducido
              </span>
            </span>
            <span className="font-mono font-medium">{formatEuro(cartItems.length > 0 ? ivaCuota : 0)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-dashed border-slate-200/80 mt-1">
            <span>TOTAL (IVA Incluido):</span>
            <span className="font-mono text-lg text-slate-950">{formatEuro(total)}</span>
          </div>
        </div>

        {/* Comanda de Cocina Control Block */}
        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-2xs font-extrabold text-amber-850 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
              <span>Control de Cocina</span>
            </span>
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase">
              {cartItems.length} uds.
            </span>
          </div>
          
          <input
            type="text"
            placeholder="Anotaciones de cocina (ej. Sin sal, pimientos bien hechos...)"
            value={kitchenNotes}
            onChange={(e) => setKitchenNotes(e.target.value)}
            disabled={cartItems.length === 0}
            className="w-full px-3 py-1.5 text-xs bg-white border border-amber-250/60 rounded-lg focus:outline-none focus:border-amber-400 text-slate-700 transition-all font-sans"
          />
          
          <button
            id="btn-send-kitchen"
            type="button"
            disabled={cartItems.length === 0}
            onClick={handleSendToKitchen}
            className={`w-full py-1.5 px-3 rounded-lg font-bold text-2xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              cartItems.length === 0
                ? 'bg-amber-100/40 text-amber-300 border border-amber-100 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Enviar Comanda a Cocina</span>
          </button>
        </div>

        {/* Pago Seleccionado */}
        <div>
          <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-pay-cash"
              type="button"
              onClick={() => setSelectedPayment('Efectivo')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                selectedPayment === 'Efectivo'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Efectivo</span>
            </button>
            <button
              id="btn-pay-card"
              type="button"
              onClick={() => setSelectedPayment('Tarjeta')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                selectedPayment === 'Tarjeta'
                  ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Tarjeta</span>
            </button>
          </div>
        </div>

        {/* Acciones de Cobro y Compartición */}
        <div className="space-y-1.5">
          <button
            id="btn-split-bill"
            type="button"
            disabled={cartItems.length === 0}
            onClick={onOpenSplitModal}
            className={`w-full py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              cartItems.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800 shadow-3xs'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>COMPARTIR / DIVIDIR CUENTA</span>
          </button>

          <button
            id="btn-process-payment"
            disabled={cartItems.length === 0 || isProcessing}
            onClick={onProcessPayment}
            className={`w-full py-3 px-4 rounded-xl text-white font-black tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              cartItems.length === 0
                ? 'bg-slate-300 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-98 border-b-3 border-amber-700 hover:border-amber-800'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Banknote className="w-4 h-4 shrink-0" />
                <span>PAGAR Y GENERAR TICKET</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
