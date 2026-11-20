import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { obtenerTemaComercio } from '../../utils/temasComercio';

const leerColorTema = () => {
  try {
    const comercioLocal = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioLocal.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const CartDrawer = ({ onOpenCheckout, colorTema, tema: temaProp }) => {
  const { totalPrice, totalItems, cart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false); // Estado para abrir/cerrar el panel flotante
  const [temaIdActual, setTemaIdActual] = useState(
    () => temaProp?.id || colorTema || leerColorTema()
  );

  useEffect(() => {
    if (temaProp?.id || colorTema) {
      setTemaIdActual(temaProp?.id || colorTema);
    }
  }, [temaProp?.id, colorTema]);

  useEffect(() => {
    const sincronizarTema = (evento) => {
      setTemaIdActual(
        evento?.detail?.colorTema || temaProp?.id || colorTema || leerColorTema()
      );
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarTema);
    window.addEventListener('valhalla:comercio-actualizado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarTema);
      window.removeEventListener('valhalla:comercio-actualizado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
    };
  }, [temaProp?.id, colorTema]);

  if (totalItems === 0) return null;

  const tema = temaProp || obtenerTemaComercio(temaIdActual);

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-white/85 backdrop-blur-xl text-slate-900 border-2 ${tema.bordeDestacado} rounded-3xl p-3.5 md:p-4 shadow-2xl flex flex-col gap-3 transition-all`}
    >
      {/* 🟢 PANEL DESPLEGABLE CON EFECTO GLASS & BLUR (Se muestra solo si isOpen es true) */}
      {isOpen && (
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar border-b border-slate-200/80 pb-3">
          <div className="flex items-center justify-between pb-1">
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${tema.textoAcento}`}
            >
              Detalle de tu Compra
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>

          {cart.map((item) => {
            const subtotalItem =
              Number(item.precioOferta || item.precio || 0) * Number(item.quantity);
            return (
              <div
                key={item.cartItemId || item.id}
                className="flex items-center justify-between bg-white/90 border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  {item.imagen && (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                    />
                  )}
                  <div className="truncate">
                    <h4 className="text-xs font-black text-slate-800 truncate">{item.nombre}</h4>
                    {item.talle && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${tema.badgeSuave}`}
                      >
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
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-black w-5 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId || item.id, 1)}
                    className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs transition-colors cursor-pointer ${tema.botonPrimario}`}
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
      <div
        className="flex items-center justify-between gap-2 cursor-pointer select-none min-w-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${tema.iconoSuave}`}
          >
            <i
              className={`bx ${
                isOpen ? 'bx-chevron-down' : 'bx-cart-alt'
              } text-xl font-black transition-transform`}
            ></i>
          </div>

          <div className="min-w-0">
            <span
              className={`text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1 truncate ${tema.loaderTexto}`}
            >
              Valhalla Store ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})
              <span className="text-[9px] underline text-slate-400 font-normal ml-1">
                ({isOpen ? 'ocultar' : 'ver detalle'})
              </span>
            </span>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight block truncate">
              ${totalPrice.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Evita que se abra/cierre el panel al hacer clic en el botón de enviar
            onOpenCheckout();
          }}
          className={`font-black px-3.5 sm:px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-lg flex items-center gap-1.5 sm:gap-2 uppercase tracking-wide text-[11px] sm:text-xs md:text-sm transition-transform active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${tema.botonPrimario}`}
        >
          <i className="bx bxl-whatsapp text-base sm:text-lg md:text-xl"></i> Enviar Pedido
        </button>
      </div>
    </div>
  );
};