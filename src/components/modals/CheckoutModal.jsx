import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
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

export const CheckoutModal = ({ isOpen, onClose, colorTema }) => {
  const { storeId } = useParams(); // Obtenemos el ID del comercio directamente de la URL pública
  const { cart, totalPrice, clearCart } = useCart();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefonoComercio, setTelefonoComercio] = useState('');
  const [nombreComercio, setNombreComercio] = useState('VALHALLA STORE');
  const [temaIdActual, setTemaIdActual] = useState(() => colorTema || leerColorTema());

  useEffect(() => {
    if (colorTema) {
      setTemaIdActual(colorTema);
    }
  }, [colorTema]);

  useEffect(() => {
    const sincronizarTema = (evento) => {
      setTemaIdActual(evento?.detail?.colorTema || colorTema || leerColorTema());
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarTema);
    window.addEventListener('valhalla:comercio-actualizado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarTema);
      window.removeEventListener('valhalla:comercio-actualizado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
    };
  }, [colorTema]);

  // Consultamos Firestore al abrir el modal para asegurar tener el número de WhatsApp del comercio desde cualquier dispositivo
  useEffect(() => {
    const fetchDatosComercio = async () => {
      if (!storeId) {
        // Fallback por si se abre desde el panel de admin donde no hay :storeId en la URL
        const comercioLocal = (() => {
          try {
            return JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
          } catch {
            return {};
          }
        })();
        setTelefonoComercio(comercioLocal.phone || comercioLocal.whatsapp || '');
        setNombreComercio(comercioLocal.name || comercioLocal.nombreComercio || 'VALHALLA STORE');
        if (!colorTema && comercioLocal.colorTema) {
          setTemaIdActual(comercioLocal.colorTema);
        }
        return;
      }

      try {
        const docRef = doc(db, 'comercios', storeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTelefonoComercio(data.phone || data.whatsapp || '');
          setNombreComercio(data.name || data.nombreComercio || 'VALHALLA STORE');
          if (!colorTema && data.colorTema) {
            setTemaIdActual(data.colorTema);
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del comercio para el checkout:', error);
      }
    };

    if (isOpen) {
      fetchDatosComercio();
    }
  }, [isOpen, storeId, colorTema]);

  if (!isOpen) return null;

  const tema = obtenerTemaComercio(temaIdActual);

  const enviarWhatsApp = (e) => {
    e.preventDefault();

    if (!telefonoComercio) {
      alert(
        'Error: Este comercio no tiene configurado un número de WhatsApp para recibir pedidos.'
      );
      return;
    }

    let mensaje = `*¡NUEVO PEDIDO DE ${nombreComercio.toUpperCase()}!* 🛒\n\n`;
    mensaje += `*Cliente:* ${nombre}\n`;
    mensaje += `*Teléfono:* ${telefono}\n`;
    mensaje += `*Dirección:* ${direccion}\n\n`;
    mensaje += `*DETALLE DEL PEDIDO:*\n`;

    cart.forEach((item) => {
      const subtotalItem =
        Number(item.precioOferta || item.precio || 0) * Number(item.quantity);
      mensaje += `- ${item.quantity}x ${item.nombre}`;
      if (item.talle) mensaje += ` (Talle: ${item.talle})`;
      mensaje += ` ($${subtotalItem.toLocaleString('es-AR')})\n`;
    });

    mensaje += `\n*TOTAL A PAGAR: $${totalPrice.toLocaleString('es-AR')}*`;

    const cleanNumber = telefonoComercio.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-4">
          <span
            className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${tema.badgeSuave}`}
          >
            Checkout Digital
          </span>
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <i className={`bx bxl-whatsapp text-2xl ${tema.loaderTexto}`}></i> Finalizar Pedido
          </h2>
        </div>

        <form onSubmit={enviarWhatsApp} className="space-y-3.5 text-xs font-bold text-slate-600">
          <div>
            <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
              Tu Nombre y Apellido
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
              Teléfono / WhatsApp de Contacto
            </label>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 11 2345 6789"
              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
              Dirección / Esquina de Entrega
            </label>
            <input
              type="text"
              required
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Av. Calchaquí 1234"
              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${tema.inputFoco}`}
            />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-rose-800">
            <i className="bx bx-map-pin text-lg text-rose-600 shrink-0 mt-0.5"></i>
            <p className="text-[11px] font-medium leading-relaxed">
              <strong className="font-black block text-rose-900 mb-0.5">
                💡 ¡Consejo para una entrega más rápida!
              </strong>
              Al abrirse el chat de WhatsApp, te sugerimos{' '}
              <span className="font-bold underline">
                enviar tu ubicación en tiempo real o por GPS
              </span>{' '}
              para que el repartidor llegue sin demoras.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Total a abonar:</span>
            <span className="text-base md:text-lg font-black text-slate-900">
              ${totalPrice.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            type="submit"
            className={`w-full font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs md:text-sm tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 mt-2 cursor-pointer ${tema.botonPrimario}`}
          >
            Enviar Pedido por WhatsApp 🚀
          </button>
        </form>
      </div>
    </div>
  );
};