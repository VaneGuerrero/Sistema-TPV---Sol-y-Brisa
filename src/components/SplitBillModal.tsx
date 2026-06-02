/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CartItem, Product, Sale } from '../types';
import { formatEuro } from '../utils';
import { 
  X, 
  Users, 
  User, 
  Plus, 
  Minus, 
  Check, 
  CreditCard, 
  Banknote, 
  Coins, 
  Receipt,
  AlertCircle
} from 'lucide-react';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  selectedMesa: string;
  onRegisterCustomSale: (itemsToRegister: CartItem[], method: 'Efectivo' | 'Tarjeta', descriptionSuffix?: string) => Promise<Sale | null>;
  onRemoveItemsFromCart: (itemsToRemove: { productId: string; quantity: number }[]) => void;
}

export default function SplitBillModal({
  isOpen,
  onClose,
  cartItems,
  selectedMesa,
  onRegisterCustomSale,
  onRemoveItemsFromCart
}: SplitBillModalProps) {
  const [splitMode, setSplitMode] = useState<'equal' | 'items'>('equal');
  
  // Total of active items
  const totalAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Equal split states
  const [numPeopleEqual, setNumPeopleEqual] = useState(2);
  const [equalPayments, setEqualPayments] = useState<{ id: number; paid: boolean; method: 'Efectivo' | 'Tarjeta'; ticketNo?: string }[]>([]);

  // Itemized split states
  const [numPeopleItems, setNumPeopleItems] = useState(2);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0); // active person to assign items to
  
  // itemAssignments: maps personIndex (0 to N-1) to list of allocated item quantities
  // Structure: { [personIndex]: { [productId]: quantity } }
  const [itemAssignments, setItemAssignments] = useState<{ [key: number]: { [productId: string]: number } }>({});
  const [itemizedPayments, setItemizedPayments] = useState<{ [key: number]: { paid: boolean; method: 'Efectivo' | 'Tarjeta'; ticketNo?: string } }>({});

  const [loadingPay, setLoadingPay] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize equal split array on tab switch / people quantity modify
  useEffect(() => {
    const list = Array.from({ length: numPeopleEqual }, (_, i) => {
      const existing = equalPayments[i];
      return {
        id: i + 1,
        paid: existing?.paid || false,
        method: existing?.method || 'Efectivo',
        ticketNo: existing?.ticketNo || undefined
      };
    });
    setEqualPayments(list);
  }, [numPeopleEqual, totalAmount]);

  // Clean success/error info on dialog interactions
  useEffect(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [splitMode, isOpen]);

  if (!isOpen) return null;

  // Handle equal payment transaction
  const handlePayEqualPart = async (index: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingPay(index);

    try {
      const partAmount = Math.round((totalAmount / numPeopleEqual) * 100) / 100;
      
      // Simulate/Generate fraction of items based on share weight to make a valid Factura Simplificada
      const customItems: CartItem[] = cartItems.map(it => {
        const itemFractionQty = Math.round((it.quantity / numPeopleEqual) * 100) / 100;
        return {
          product: {
            ...it.product,
            price: Math.round((it.product.price / numPeopleEqual) * 1000) / 1000 // scale down price equally
          },
          quantity: it.quantity
        };
      });

      const paymentMethod = equalPayments[index].method;
      const registered = await onRegisterCustomSale(
        customItems, 
        paymentMethod, 
        `(Pago ${index + 1}/${numPeopleEqual} - Parte Igual)`
      );

      if (registered) {
        setEqualPayments(prev => prev.map((p, i) => i === index ? { ...p, paid: true, ticketNo: registered.ticketNumber } : p));
        setSuccessMessage(`¡Parte ${index + 1} de ${numPeopleEqual} cobrada correctamente! (${formatEuro(partAmount)})`);
      } else {
        throw new Error('Error al registrar la transacción.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando cobro parcial.');
    } finally {
      setLoadingPay(null);
    }
  };

  // Assign items logic
  const handleAssignItem = (product: Product, direction: 'add' | 'remove') => {
    // Get total items in cart
    const itemInCart = cartItems.find(it => it.product.id === product.id);
    if (!itemInCart) return;

    // Get current total assigned elsewhere
    let currentAssignedTotal = 0;
    Object.entries(itemAssignments).forEach(([pIdx, assignedMap]) => {
      // Don't count current selected person if removing
      if (Number(pIdx) === selectedPersonIndex && direction === 'remove') return;
      currentAssignedTotal += (assignedMap[product.id] || 0);
    });

    const activePersonAssigned = itemAssignments[selectedPersonIndex]?.[product.id] || 0;
    
    let nextPersonQty = activePersonAssigned;
    if (direction === 'add') {
      const maxAvailable = itemInCart.quantity - currentAssignedTotal;
      if (nextPersonQty < maxAvailable) {
        nextPersonQty += 1;
      }
    } else {
      if (nextPersonQty > 0) {
        nextPersonQty -= 1;
      }
    }

    setItemAssignments(prev => ({
      ...prev,
      [selectedPersonIndex]: {
        ...(prev[selectedPersonIndex] || {}),
        [product.id]: nextPersonQty
      }
    }));
  };

  // Get unassigned items remaining
  const getUnassignedItemQuantity = (productId: string, totalQty: number) => {
    let assigned = 0;
    Object.entries(itemAssignments).forEach(([pIdx, map]) => {
      assigned += (map[productId] || 0);
    });
    return Math.max(0, totalQty - assigned);
  };

  // Calculate dynamic person totals
  const getPersonTotal = (personIdx: number) => {
    let subtotal = 0;
    const assignments = itemAssignments[personIdx] || {};
    Object.entries(assignments).forEach(([pId, val]) => {
      const qty = Number(val);
      const originalProduct = cartItems.find(it => it.product.id === pId)?.product;
      if (originalProduct && qty > 0) {
        subtotal += originalProduct.price * qty;
      }
    });
    return subtotal;
  };

  // Pay by item for selected person index
  const handlePayItemizedPerson = async (personIdx: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    const assignments = itemAssignments[personIdx] || {};
    const subtotal = getPersonTotal(personIdx);

    if (subtotal <= 0) {
      setErrorMessage(`La persona ${personIdx + 1} no tiene artículos asignados.`);
      return;
    }

    setLoadingPay(personIdx + 100); // offset

    try {
      // Re-create products list to check out
      const checkoutItems: CartItem[] = [];
      Object.entries(assignments).forEach(([pId, val]) => {
        const qty = Number(val);
        if (qty > 0) {
          const originalItem = cartItems.find(it => it.product.id === pId);
          if (originalItem) {
            checkoutItems.push({
              product: originalItem.product,
              quantity: qty
            });
          }
        }
      });

      const method = itemizedPayments[personIdx]?.method || 'Efectivo';
      const registered = await onRegisterCustomSale(
        checkoutItems, 
        method, 
        `(Comensal ${personIdx + 1} - Cobro por placa)`
      );

      if (registered) {
        // Set individual comensal as paid
        setItemizedPayments(prev => ({
          ...prev,
          [personIdx]: { paid: true, method, ticketNo: registered.ticketNumber }
        }));

        // Remove these checked out items permanently from the main cart session
        const itemsToRemove = checkoutItems.map(it => ({
          productId: it.product.id,
          quantity: it.quantity
        }));
        onRemoveItemsFromCart(itemsToRemove);

        // Delete person allocations to prevent re-billing
        setItemAssignments(prev => {
          const updated = { ...prev };
          delete updated[personIdx];
          return updated;
        });

        setSuccessMessage(`¡Comensal ${personIdx + 1} cobrado con éxito! (${formatEuro(subtotal)}). Se han restado los ítems del carro general.`);
      } else {
        throw new Error('Error de pasarela al registrar comensal.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error cobrando items de persona.');
    } finally {
      setLoadingPay(null);
    }
  };

  // Auto clean screen or checkout
  const isEverythingPaidEqual = equalPayments.length > 0 && equalPayments.every(p => p.paid);
  
  const handleFinishEqualCheckout = () => {
    // Zero out main cart by removing everything
    const itemsToRemove = cartItems.map(it => ({
      productId: it.product.id,
      quantity: it.quantity
    }));
    onRemoveItemsFromCart(itemsToRemove);
    setEqualPayments([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[680px] overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* HEADER */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase">Compartir o Dividir Cuenta</h2>
              <p className="text-2xs text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
                {selectedMesa} • Cuenta Total: <span className="text-slate-900 font-mono text-xs">{formatEuro(totalAmount)}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLLER SWITCH TABS */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/40 shrink-0">
          <button
            type="button"
            onClick={() => setSplitMode('equal')}
            className={`py-3.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              splitMode === 'equal'
                ? 'border-indigo-600 bg-white text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>DIVIDIR A PARTES IGUALES</span>
          </button>
          
          <button
            type="button"
            disabled={totalAmount <= 0}
            onClick={() => {
              setSplitMode('items');
              setItemAssignments({});
              setItemizedPayments({});
            }}
            className={`py-3.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              totalAmount <= 0 ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              splitMode === 'items'
                ? 'border-indigo-600 bg-white text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>SELECCIONAR QUÉ PAGA CADA QUIÉN</span>
          </button>
        </div>

        {/* FEEDBACK STATUS CHANNELS */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xs font-bold rounded-xl flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>{successMessage}</span>
            </span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-2xs font-bold rounded-xl flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">✕</button>
          </div>
        )}

        {/* SCROLLABLE INTERACTIVE BODY */}
        <div className="flex-1 overflow-hidden p-6">
          {splitMode === 'equal' ? (
            /* ======================================= */
            /* EQUAL DIVISIONS BLOCK                   */
            /* ======================================= */
            <div className="flex flex-col h-full space-y-5">
              
              {/* Selector bar for number of people */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase">¿Entre cuántas personas dividimos?</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Se generará una Factura Simplificada independiente para cada parte cobrada.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={numPeopleEqual <= 2}
                    onClick={() => setNumPeopleEqual(p => p - 1)}
                    className="w-10 h-10 bg-white border border-slate-250 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none cursor-pointer active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-black font-mono text-slate-800 w-8 text-center">{numPeopleEqual}</span>
                  <button
                    type="button"
                    disabled={numPeopleEqual >= 10}
                    onClick={() => setNumPeopleEqual(p => p + 1)}
                    className="w-10 h-10 bg-white border border-slate-250 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Equidistributed list of installments */}
              <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl bg-slate-50/20 divide-y divide-slate-150 p-1">
                {equalPayments.map((p, idx) => {
                  const partTotal = Math.round((totalAmount / numPeopleEqual) * 100) / 100;
                  return (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white transition-all rounded-xl">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          p.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.paid ? <Check className="w-4 h-4 stroke-[3]" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">Payer {p.id} de {numPeopleEqual}</h4>
                          <p className="text-3xs text-slate-400 font-semibold font-mono leading-none">
                            {p.paid ? `COBRADO • Ticket: ${p.ticketNo}` : 'PAGO POR COBRAR'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-black text-slate-850">
                          {formatEuro(partTotal)}
                        </span>

                        {!p.paid ? (
                          <>
                            {/* Short Method Selector */}
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => setEqualPayments(prev => prev.map(item => item.id === p.id ? { ...item, method: 'Efectivo' } : item))}
                                className={`px-2 py-1 rounded text-3xs font-black transition-all cursor-pointer ${
                                  p.method === 'Efectivo' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500'
                                }`}
                              >
                                Efe.
                              </button>
                              <button
                                type="button"
                                onClick={() => setEqualPayments(prev => prev.map(item => item.id === p.id ? { ...item, method: 'Tarjeta' } : item))}
                                className={`px-2 py-1 rounded text-3xs font-black transition-all cursor-pointer ${
                                  p.method === 'Tarjeta' ? 'bg-white text-blue-700 shadow-3xs' : 'text-slate-500'
                                }`}
                              >
                                Tar.
                              </button>
                            </div>

                            <button
                              id={`cobrar-igual-${idx}`}
                              type="button"
                              onClick={() => handlePayEqualPart(idx)}
                              disabled={loadingPay !== null}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xs uppercase tracking-wide rounded-xl shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-45"
                            >
                              {loadingPay === idx ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  {p.method === 'Tarjeta' ? <CreditCard className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                                  <span>Cobrar Parte</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-2xs font-extrabold rounded-lg select-none">
                            ✓ Pago Registrado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FINALIZE PANEL */}
              {isEverythingPaidEqual && (
                <div className="bg-emerald-550 text-white rounded-2xl p-4 flex items-center justify-between shrink-0 shadow-md">
                  <div>
                    <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                      <Check className="w-5 h-5 stroke-[3.5] bg-white text-emerald-600 rounded-full p-0.5" />
                      <span>¡Cuenta Saldada Exitosamente!</span>
                    </h4>
                    <p className="text-3xs text-emerald-100 font-mono mt-0.5">Todos los comensales han aportado su parte correspondiente en caja.</p>
                  </div>
                  <button
                    id="btn-confirm-equal-all"
                    type="button"
                    onClick={handleFinishEqualCheckout}
                    className="px-4 py-2 bg-white text-emerald-800 font-black text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
                  >
                    CERRAR Y LIMPIAR MESA
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* ======================================= */
            /* ITEMIZED SPLIT BY WHO PAYS WHAT         */
            /* ======================================= */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full overflow-hidden">
              
              {/* Product Inventory assigning checklist (Left - md:span-5) */}
              <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-5 h-full overflow-hidden">
                <div className="mb-3 shrink-0">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Platos del Carro</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Asigna los platos a la persona actualmente seleccionada a la derecha.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {cartItems.map(it => {
                    const unassignedQty = getUnassignedItemQuantity(it.product.id, it.quantity);
                    const activeAssigned = itemAssignments[selectedPersonIndex]?.[it.product.id] || 0;

                    return (
                      <div 
                        key={it.product.id} 
                        className={`p-2.5 bg-white border border-slate-150 rounded-xl transition-all ${
                          activeAssigned > 0 ? 'border-indigo-400 shadow-3xs bg-indigo-50/5' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-xs leading-tight block">{it.product.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {formatEuro(it.product.price)} c/u • <span className="font-bold">Quedan {unassignedQty}</span> sin asignar
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAssignItem(it.product, 'remove')}
                              disabled={activeAssigned <= 0}
                              className="w-5 h-5 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-extrabold text-slate-800 font-mono w-4 text-center">{activeAssigned}</span>
                            <button
                              type="button"
                              onClick={() => handleAssignItem(it.product, 'add')}
                              disabled={unassignedQty <= 0}
                              className="w-5 h-5 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payers allocator column (Right - md:span-7) */}
              <div className="flex flex-col bg-slate-50/40 border border-slate-200 rounded-2xl p-4 md:col-span-7 h-full overflow-hidden">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-850 uppercase">Asignación de Comensales</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Selecciona un comensal y asígnale su comida.</p>
                  </div>
                  
                  {/* People count selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      disabled={numPeopleItems <= 2}
                      onClick={() => {
                        const nextCount = numPeopleItems - 1;
                        setNumPeopleItems(nextCount);
                        setSelectedPersonIndex(0);
                      }}
                      className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-extrabold font-mono text-slate-850 w-5 text-center">{numPeopleItems}</span>
                    <button
                      type="button"
                      disabled={numPeopleItems >= 6}
                      onClick={() => setNumPeopleItems(numPeopleItems + 1)}
                      className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Comensales vertical stack list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {Array.from({ length: numPeopleItems }).map((_, i) => {
                    const isSelected = selectedPersonIndex === i;
                    const personTotal = getPersonTotal(i);
                    const isPaid = itemizedPayments[i]?.paid;
                    const paymentInfo = itemizedPayments[i];

                    // collect item summaries
                    const itemSummaryList: string[] = [];
                    const assigned = itemAssignments[i] || {};
                    Object.entries(assigned).forEach(([pId, val]) => {
                      const qty = Number(val);
                      if (qty > 0) {
                        const name = cartItems.find(it => it.product.id === pId)?.product.name || 'Art.';
                        itemSummaryList.push(`${qty}x ${name}`);
                      }
                    });

                    return (
                      <div
                        key={i}
                        onClick={() => !isPaid && setSelectedPersonIndex(i)}
                        className={`p-3.5 rounded-xl border transition-all relative ${
                          isPaid 
                            ? 'bg-emerald-50 border-emerald-200 opacity-80 cursor-default' 
                            : isSelected
                              ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm cursor-pointer'
                              : 'bg-white border-slate-150 hover:bg-slate-50 cursor-pointer hover:border-slate-250'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-2xs ${
                              isPaid ? 'bg-emerald-100 text-emerald-700' : isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs">Comensal {i + 1}</h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {isPaid ? `Cobrado ✓ Ticket: ${paymentInfo?.ticketNo}` : isSelected ? '👉 Editando asignación...' : 'Haga click para asignar platos'}
                              </p>
                            </div>
                          </div>

                          <span className="font-mono text-base font-black text-slate-800 shrink-0">
                            {formatEuro(personTotal)}
                          </span>
                        </div>

                        {/* Platos asignados summary text */}
                        {itemSummaryList.length > 0 && (
                          <div className="mt-2.5 border-t border-slate-100 pt-2 flex flex-wrap gap-1">
                            {itemSummaryList.map((str, idx) => (
                              <span key={idx} className="bg-slate-105 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                {str}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons inside payer card */}
                        {!isPaid && personTotal > 0 && (
                          <div className="mt-3.5 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemizedPayments(prev => ({ ...prev, [i]: { paid: false, method: 'Efectivo' } }));
                                }}
                                className={`px-2 py-1 rounded text-3xs font-black transition-all cursor-pointer ${
                                  (itemizedPayments[i]?.method || 'Efectivo') === 'Efectivo' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500'
                                }`}
                              >
                                Efe.
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemizedPayments(prev => ({ ...prev, [i]: { paid: false, method: 'Tarjeta' } }));
                                }}
                                className={`px-2 py-1 rounded text-3xs font-black transition-all cursor-pointer ${
                                  itemizedPayments[i]?.method === 'Tarjeta' ? 'bg-white text-blue-700 shadow-3xs' : 'text-slate-500'
                                }`}
                              >
                                Tar.
                              </button>
                            </div>

                            <button
                              id={`cobrar-items-${i}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayItemizedPerson(i);
                              }}
                              disabled={loadingPay !== null}
                              className="px-3 py-1.5 bg-slate-900 border-b-2 border-slate-950 text-white hover:bg-indigo-650 font-black text-2xs uppercase tracking-wide rounded-xl flex items-center gap-1 transition-all cursor-pointer disabled:opacity-45"
                            >
                              {loadingPay === i + 100 ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Coins className="w-3.5 h-3.5" />
                                  <span>Cobrar {formatEuro(personTotal)}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
