import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export const CartDrawer = ({ onOpenCheckout }) => {
  const { totalPrice, totalItems, cart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false); // Estado para abrir/cerrar el panel flotante

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-white/75 backdrop-blur-xl text-slate-900 border border-white/60 rounded-3xl p-3.5 md:p-4 shadow-2xl shadow-emerald-950/15 flex flex-col gap-3 transition-all">
      
      {/* 🟢 PANEL DESPLEGABLE CON EFECTO GLASS & BLUR (Se muestra solo si isOpen es true) */}
      {isOpen && (
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar border-b border-slate-200/60 pb-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Detalle de tu Compra</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>

          {cart.map((item) => {
            const subtotalItem = Number(item.precioOferta || item.precio || 0) * Number(item.quantity);
            return (
              <div key={item.cartItemId || item.id} className="flex items-center justify-between bg-white/80 border border-emerald-100/80 rounded-2xl p-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {item.imagen && (
                    <img src={item.imagen} alt={item.nombre} className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0 bg-white" />
                  )}
                  <div className="truncate">
                    <h4 className="text-xs font-black text-slate-800 truncate">{item.nombre}</h4>
                    {item.talle && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-0.5">
                        Talle: {item.talle}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                      ${subtotalItem.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Controles de Cantidad */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-black w-5 text-center text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId || item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🟢 BARRA INFERIOR FLOTANTE (Haz clic aquí para desplegar/contraer el carrito o ver totales) */}
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
            <i className={`bx ${isOpen ? 'bx-chevron-down' : 'bx-cart-alt'} text-emerald-700 text-xl font-black transition-transform`}></i>
          </div>

          <div>
            <span className="text-[10px] md:text-xs text-emerald-700 font-black uppercase tracking-wider flex items-center gap-1">
              Valhalla Store ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}) 
              <span className="text-[9px] underline text-slate-400 font-normal ml-1">({isOpen ? 'ocultar' : 'ver detalle'})</span>
            </span>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              ${totalPrice.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita que se abra/cierre el panel al hacer clic en el botón de enviar
            onOpenCheckout();
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 uppercase tracking-wide text-xs md:text-sm transition-transform active:scale-95 cursor-pointer"
        >
          <i className='bx bxl-whatsapp text-lg md:text-xl'></i> Enviar Pedido
        </button>
      </div>

    </div>
  );
};