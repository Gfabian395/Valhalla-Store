import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { cart, totalPrice, clearCart } = useCart();
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ubicacionMaps, setUbicacionMaps] = useState('');
  const [loadingLoc, setLoadingLoc] = useState(false);

  if (!isOpen) return null;

  const obtenerUbicacion = () => {
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const linkMaps = `https://maps.google.com/?q=${lat},${lng}`;
          setUbicacionMaps(linkMaps);
          setLoadingLoc(false);
        },
        () => {
          alert('No se pudo obtener la ubicación automática. Escribila en la dirección.');
          setLoadingLoc(false);
        }
      );
    } else {
      alert('La geolocalización no está soportada por tu navegador.');
      setLoadingLoc(false);
    }
  };

  const enviarWhatsApp = (e) => {
    e.preventDefault();

    const comercioGuardado = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    const numeroWhatsApp = comercioGuardado.whatsapp;

    if (!numeroWhatsApp) {
      alert('Error: No se encontró un comercio registrado o falta configurar el número de WhatsApp.');
      return;
    }

    let mensaje = `*¡NUEVO PEDIDO DE ${comercioGuardado.nombreComercio ? comercioGuardado.nombreComercio.toUpperCase() : 'VALHALLA STORE'}!* 🛒\n\n`;
    mensaje += `*Cliente:* ${nombre}\n`;
    mensaje += `*Dirección:* ${direccion}\n`;
    if (ubicacionMaps) mensaje += `*Ubicación Maps:* ${ubicacionMaps}\n\n`;
    mensaje += `*DETALLE DEL PEDIDO:*\n`;

    cart.forEach((item) => {
      const subtotalItem = Number(item.precioOferta) * Number(item.quantity);
      mensaje += `- ${item.quantity}x ${item.nombre} ($${subtotalItem.toLocaleString()})\n`;
    });

    mensaje += `\n*TOTAL A PAGAR: $${totalPrice.toLocaleString()}*`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-white/20 relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
        >
          ✕
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-black tracking-widest text-green-600 uppercase bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            Checkout Digital
          </span>
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-2 flex items-center gap-2">
            <i className='bx bxl-whatsapp text-green-600 text-2xl'></i> Finalizar Pedido
          </h2>
        </div>

        <form onSubmit={enviarWhatsApp} className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div>
            <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Tu Nombre y Apellido</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Dirección / Esquina de Entrega</label>
            <input
              type="text"
              required
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Av. Calchaquí 1234"
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={obtenerUbicacion}
              className="w-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 font-bold text-xs py-3 px-3 rounded-2xl border-2 border-dashed border-blue-300 flex items-center justify-center gap-2 transition-colors"
            >
              <i className='bx bx-map text-base'></i> 
              {loadingLoc ? "Obteniendo ubicación..." : ubicacionMaps ? "📍 Ubicación Capturada con Éxito" : "Marcar mi ubicación exacta (Maps)"}
            </button>
          </div>

          <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/80 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Total a abonar:</span>
            <span className="text-base md:text-lg font-black text-red-600">${totalPrice.toLocaleString()}</span>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs md:text-sm tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 mt-2"
          >
            Enviar Pedido por WhatsApp 🚀
          </button>
        </form>
      </div>
    </div>
  );
};