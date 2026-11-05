import React from 'react';
import { useCart } from '../../context/CartContext';

export const CartDrawer = ({ onOpenCheckout }) => {
  const { totalPrice, totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-xl text-white border-2 border-yellow-400 rounded-3xl p-3 md:p-4 shadow-2xl flex items-center justify-between">
      <div>
        <span className="text-[10px] md:text-xs text-yellow-400 font-bold block">Total ({totalItems} ítems)</span>
        <span className="text-xl md:text-2xl font-black text-white">${totalPrice.toLocaleString()}</span>
      </div>

      <button
        onClick={onOpenCheckout}
        className="bg-green-600 hover:bg-green-700 text-white font-black px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-lg flex items-center gap-2 uppercase tracking-wide text-xs md:text-sm transition-all transform active:scale-95"
      >
        <i className='bx bxl-whatsapp text-lg md:text-xl'></i> Enviar Pedido
      </button>
    </div>
  );
};