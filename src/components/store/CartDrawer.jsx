import React from 'react';
import { useCart } from '../../context/CartContext';

export const CartDrawer = ({ onOpenCheckout }) => {
  const { totalPrice, totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-white/95 backdrop-blur-xl text-slate-900 border-2 border-emerald-500 rounded-3xl p-3 md:p-4 shadow-2xl flex items-center justify-between">
      
      {/* Sección del Ícono/Espartano y Totales */}
      <div className="flex items-center gap-3">
        {/* Símbolo / Mascota Espartana miniatura en diseño claro */}
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
          <i className='bx bx-shield-alt-2 text-emerald-700 text-xl font-black'></i>
        </div>

        <div>
          <span className="text-[10px] md:text-xs text-emerald-700 font-black uppercase tracking-wider block">
            Valhalla Store ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})
          </span>
          <span className="text-xl md:text-2xl font-black text-slate-900">
            ${totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Botón de Acción */}
      <button
        onClick={onOpenCheckout}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 uppercase tracking-wide text-xs md:text-sm transition-all transform active:scale-95 cursor-pointer"
      >
        <i className='bx bxl-whatsapp text-lg md:text-xl'></i> Enviar Pedido
      </button>
      
    </div>
  );
};