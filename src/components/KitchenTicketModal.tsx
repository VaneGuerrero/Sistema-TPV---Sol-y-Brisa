/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CartItem } from '../types';
import { formatDate } from '../utils';
import { Printer, CheckCircle2, CookingPot, NotepadText, Send } from 'lucide-react';

interface KitchenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  mesa: string;
  notes: string;
  ticketNumber: string;
}

export default function KitchenTicketModal({
  isOpen,
  onClose,
  cartItems,
  mesa,
  notes,
  ticketNumber
}: KitchenTicketModalProps) {
  if (!isOpen) return null;

  // Filter items that might be food or deserve preparation (e.g. food items like tapas, bocadillos, postres)
  // or show all ordered items so that kitchen waitstaff are fully informed.
  const foodItems = cartItems.filter(it => it.product.category !== 'bebidas');
  const drinkItems = cartItems.filter(it => it.product.category === 'bebidas');

  const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleMockPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-scale-up">
        
        {/* BANNER TRANSITION EFFECT PROGRESS */}
        <div className="bg-amber-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
              <CookingPot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wide">Comanda Enviada a Cocina</h3>
              <p className="text-[10px] text-amber-100 font-mono">Imprimiendo en cola de comandas...</p>
            </div>
          </div>
          <span className="bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded-lg text-3xs border border-amber-400 font-mono tracking-wider">
            {ticketNumber}
          </span>
        </div>

        {/* RECEIPT PAPER SIMULATION BODY */}
        <div className="flex-1 bg-slate-100/50 overflow-y-auto p-6 flex flex-col items-center">
          
          {/* THERMAL PAPER EMBOSSING PANEL */}
          <div className="bg-white w-full max-w-sm rounded-lg shadow-md border border-slate-200 p-5 font-mono text-slate-800 text-xs flex flex-col relative relative-thermal-paper">
            
            {/* Serrated upper border visual pattern */}
            <div className="absolute top-0 inset-x-0 h-1 bg-repeat-x bg-[linear-gradient(90deg,transparent_50%,#fff_50%)] bg-[size:10px_4px] -mt-1"></div>
            
            {/* HEADER PAPER PRINT */}
            <div className="text-center space-y-1 mb-4 select-none">
              <span className="text-slate-400 font-bold block leading-none">*** TPV SOL Y BRISA ***</span>
              <span className="text-lg font-black tracking-widest text-slate-900 block">COMANDA DE PREPARACIÓN</span>
              <span className="text-2xs text-slate-500 font-bold tracking-wide block">TICKET PREVIO DE TRABAJO</span>
            </div>

            {/* SEGMENT METADATA */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 space-y-1 text-2xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500 font-bold">MESA / LOCAL:</span>
                <span className="text-slate-900 text-xs font-black bg-slate-100 px-1.5 py-0.2 rounded font-mono">{mesa}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">FECHA Y HORA:</span>
                <span className="text-slate-800">{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">AUTORIZADO:</span>
                <span className="text-slate-800">Admin Colega TPV</span>
              </div>
            </div>

            {/* PREPARATION FOOD ITEMS (Tapas, Bocadillos, Postres) */}
            {foodItems.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-100/60 uppercase tracking-widest block mb-2">
                  🍲 PREPARACIÓN COCINA / TAPAS
                </span>
                <div className="space-y-2">
                  {foodItems.map(it => (
                    <div key={it.product.id} className="flex justify-between items-start text-xs font-bold font-mono">
                      <span className="text-indigo-650 font-black tracking-wide shrink-0 mr-2 border bg-indigo-50/50 border-indigo-100 px-1.5 py-0.2 rounded">
                        {it.quantity}x
                      </span>
                      <div className="flex-1">
                        <span className="text-slate-900 font-black">{it.product.name}</span>
                        {it.product.description && (
                          <span className="text-3xs text-slate-405 block select-none mt-0.5 leading-tight">{it.product.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PREPARATION DRINKS ITEMS (Bebidas / Café) */}
            {drinkItems.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-100/60 uppercase tracking-widest block mb-2">
                  🍺 PEDIDO BARRA / BEBIDAS
                </span>
                <div className="space-y-2">
                  {drinkItems.map(it => (
                    <div key={it.product.id} className="flex justify-between items-start text-xs font-bold font-mono">
                      <span className="text-indigo-650 font-black tracking-wide shrink-0 mr-2 border bg-indigo-50/50 border-indigo-100 px-1.5 py-0.2 rounded">
                        {it.quantity}x
                      </span>
                      <div className="flex-1">
                        <span className="text-slate-900 font-black">{it.product.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WAITER ANNOTATION NOTES */}
            {notes.trim() ? (
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg text-2xs text-slate-750 font-sans leading-relaxed flex items-start gap-2 mb-4">
                <NotepadText className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-extrabold text-slate-800 uppercase block tracking-wider text-[9px] mb-0.5">Indicaciones Especiales:</span>
                  <span className="italic font-bold text-slate-900">"{notes}"</span>
                </div>
              </div>
            ) : null}

            {/* TOTAL QUANTITY COMPLIANCE */}
            <div className="border-t border-dashed border-slate-300 pt-3.5 pb-2 text-center text-3xs text-slate-400 select-none">
              <span className="text-xs text-slate-850 font-black block">TOTAL ÍTEMS PREVIOS: {totalQty} unidades</span>
              <span className="block mt-1 font-mono uppercase tracking-wider">MESA ENVIADA A TERMINAL DE SERVICIO</span>
            </div>

            {/* Serrated lower border visual pattern */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-repeat-x bg-[linear-gradient(90deg,transparent_50%,#fff_50%)] bg-[size:10px_4px] rotate-180 -mb-1"></div>

          </div>

          <div className="mt-4 flex gap-2 w-full max-w-sm shrink-0">
            <button
              type="button"
              onClick={handleMockPrint}
              className="flex-1 bg-white hover:bg-slate-50 p-3 border border-slate-200 text-slate-650 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir Ticket</span>
            </button>
            
            <button
              id="btn-confirm-kitchen-comanda"
              type="button"
              onClick={onClose}
              className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-colors shadow-sm cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entendido, Enviar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
