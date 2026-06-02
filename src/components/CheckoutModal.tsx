/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale } from '../types';
import { formatEuro, formatDate } from '../utils';
import { CheckCircle2, Printer, X, Receipt, Check } from 'lucide-react';
import { useState } from 'react';

interface CheckoutModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export default function CheckoutModal({ sale, onClose }: CheckoutModalProps) {
  const [printed, setPrinted] = useState(false);
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'printing' | 'success'>('idle');

  if (!sale) return null;

  const handlePrint = () => {
    setPrintingStatus('printing');
    setTimeout(() => {
      setPrintingStatus('success');
      setPrinted(true);
      setTimeout(() => {
        setPrintingStatus('idle');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center gap-5 my-8 transform scale-100 transition-all duration-300">
        
        {/* Success Header Status inside UI (much cleaner and aesthetic than browser window.alert) */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.25]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            ¡VENTA REGISTRADA EXITOSAMENTE!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            La transacción se ha archivado adecuadamente en el historial local.
          </p>
        </div>

        {/* Paper Receipt / Thermal Ticket Look */}
        <div className="w-full bg-[#fcfbf7] border border-amber-100/70 rounded-2xl p-5 shadow-xs relative ticket-print overflow-hidden">
          {/* Jagged / raw paper cut style top border simulated */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-200/40 repeating-linear-gradient" />
          
          {/* Restaurant Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-center items-center gap-1.5 text-slate-905">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold tracking-tight text-sm uppercase">TABERNA EL CANDIL S.A.</span>
            </div>
            <p className="text-3xs text-slate-450 uppercase leading-snug font-mono">
              NIF: A-87163909<br />
              Calle de Mallorca 244, L2<br />
              08008 Barcelona, España<br />
              Tel: +34 934 876 543
            </p>
          </div>

          {/* Ticket Metadata */}
          <div className="py-3 text-3xs font-mono text-slate-600 space-y-1 border-b border-dashed border-slate-300 leading-relaxed">
            <div className="flex justify-between">
              <span>Nº TICKET / FACTURA:</span>
              <span className="font-bold text-slate-900">{sale.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA Y HORA:</span>
              <span>{formatDate(sale.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span>ZONA / SECCIÓN:</span>
              <span className="font-bold text-slate-900 uppercase">{sale.mesa}</span>
            </div>
            <div className="flex justify-between">
              <span>MÉTODO DE PAGO:</span>
              <span className="font-bold text-slate-900 uppercase bg-slate-200 px-1 rounded-xs text-[9px]">{sale.metodoPago}</span>
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="py-4 border-b border-dashed border-slate-300">
            <div className="grid grid-cols-12 text-3xs font-bold text-slate-400 font-mono mb-2">
              <span className="col-span-6 text-left">CONCEPTO</span>
              <span className="col-span-2 text-center">CANT.</span>
              <span className="col-span-2 text-right">P.U.</span>
              <span className="col-span-2 text-right">TOTAL</span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sale.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 text-3xs font-mono text-slate-700 leading-tight">
                  <span className="col-span-6 text-left break-words font-medium text-slate-900">{it.name}</span>
                  <span className="col-span-2 text-center">{it.quantity}</span>
                  <span className="col-span-2 text-right">{formatEuro(it.price)}</span>
                  <span className="col-span-2 text-right font-bold text-slate-900">{formatEuro(it.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax summary / base and total breakdown as legally required in Spain */}
          <div className="pt-3 font-mono text-3xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span>BASE IMPONIBLE (NETO):</span>
              <span className="font-medium">{formatEuro(sale.baseImponible)}</span>
            </div>
            <div className="flex justify-between">
              <span>I.V.A. APORTADO (10%):</span>
              <span className="font-medium">{formatEuro(sale.ivaAmount)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t border-dashed border-slate-200 mt-1">
              <span>TOTAL (IVA INCLUIDO):</span>
              <span className="font-mono text-sm font-extrabold text-slate-950">{formatEuro(sale.total)}</span>
            </div>
          </div>

          {/* Spain compliance note and brand footer */}
          <div className="text-center pt-5 pb-1 space-y-1">
            <p className="text-4xs text-slate-400 italic font-mono leading-none">
              Factura Simplificada acogida al Régimen de la Hostelería según Real Decreto 1619/2012 de España.
            </p>
            <div className="w-16 h-1 bg-slate-200 mx-auto rounded-full my-2" />
            <p className="text-2xs font-bold font-mono tracking-widest text-slate-800 uppercase">
              ¡GRACIAS POR SU VISITA!
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="w-full grid grid-cols-2 gap-3 pt-2">
          <button
            id="btn-print-receipt"
            onClick={handlePrint}
            disabled={printingStatus === 'printing'}
            className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              printingStatus === 'printing'
                ? 'bg-slate-150 text-slate-400 border-slate-200'
                : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 hover:text-slate-900 active:scale-97'
            }`}
          >
            {printingStatus === 'printing' ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                <span>Imprimiendo...</span>
              </>
            ) : printingStatus === 'success' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700">¡Impreso!</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>{printed ? 'Imprimir Otra Vez' : 'Imprimir Ticket'}</span>
              </>
            )}
          </button>
          
          <button
            id="btn-close-receipt-modal"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-97 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
