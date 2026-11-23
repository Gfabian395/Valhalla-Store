import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
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

const obtenerEncabezadoVenta = (itemsCarrito, nombreTienda) => {
  const tiendaUpper = String(nombreTienda || 'VALHALLA STORE').toUpperCase();
  const tieneRelampago = itemsCarrito.some((item) => Boolean(item.soloContado));
  const tieneOutlet = itemsCarrito.some((item) => Boolean(item.esOutlet));
  const tieneNormal = itemsCarrito.some((item) => !item.soloContado && !item.esOutlet);

  const tiposActivos = [
    tieneRelampago ? 'RELÁMPAGO DE CONTADO' : null,
    tieneOutlet ? 'OUTLET' : null,
    tieneNormal ? 'NORMAL' : null
  ].filter(Boolean);

  if (tiposActivos.length === 1) {
    if (tieneRelampago) {
      return `⚡ *NUEVA VENTA RELÁMPAGO DE CONTADO - ${tiendaUpper}!*`;
    }
    if (tieneOutlet) {
      return `🏷️ *NUEVA VENTA DE OUTLET - ${tiendaUpper}!*`;
    }
    return `🛒 *NUEVA VENTA NORMAL - ${tiendaUpper}!*`;
  }

  return `🛒 *NUEVO PEDIDO (${tiposActivos.join(' + ')}) - ${tiendaUpper}!*`;
};

export const CheckoutModal = ({ isOpen, onClose, colorTema }) => {
  const { storeId: storeIdUrl } = useParams();
  const { cart, totalPrice, clearCart } = useCart();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefonoComercio, setTelefonoComercio] = useState('');
  const [nombreComercio, setNombreComercio] = useState('VALHALLA STORE');
  const [enviando, setEnviando] = useState(false);
  const [temaIdActual, setTemaIdActual] = useState(() => colorTema || leerColorTema());

  const storeIdActivo = storeIdUrl || localStorage.getItem('valhalla_store_id') || '';

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

  useEffect(() => {
    const fetchDatosComercio = async () => {
      if (!storeIdActivo) {
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
        const docRef = doc(db, 'comercios', storeIdActivo);
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
  }, [isOpen, storeIdActivo, colorTema]);

  if (!isOpen) return null;

  const tema = obtenerTemaComercio(temaIdActual);

  const descontarStockEnFirestore = async (itemsCarrito) => {
    if (!storeIdActivo) return;

    const descontarPorProducto = new Map();
    for (const item of itemsCarrito) {
      if (item.disponibilidad === 'con_stock' && item.id) {
        const actual = descontarPorProducto.get(item.id) || 0;
        descontarPorProducto.set(item.id, actual + (Number(item.quantity) || 0));
      }
    }

    for (const [productId, cantidadRestar] of descontarPorProducto.entries()) {
      if (cantidadRestar <= 0) continue;
      const prodRef = doc(db, 'comercios', storeIdActivo, 'productos', productId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(prodRef);
        if (!snap.exists()) return;
        const data = snap.data();
        if (
          data.disponibilidad === 'con_stock' &&
          data.stock !== null &&
          data.stock !== undefined
        ) {
          const stockActual = Math.max(0, Number(data.stock) || 0);
          const nuevoStock = Math.max(0, stockActual - cantidadRestar);
          transaction.update(prodRef, { stock: nuevoStock });
        }
      });
    }
  };

  const registrarPedidoEnFirestore = async (itemsDetallados, tipoVentaResumen) => {
    if (!storeIdActivo) return;
    try {
      await addDoc(collection(db, 'comercios', storeIdActivo, 'pedidos'), {
        clienteNombre: nombre.trim(),
        clienteTelefono: telefono.trim(),
        clienteDireccion: direccion.trim(),
        tipoVenta: tipoVentaResumen,
        items: itemsDetallados,
        total: Number(totalPrice) || 0,
        atendido: false,
        creadoEn: serverTimestamp()
      });
    } catch (error) {
      console.warn('No se pudo registrar el pedido en Firestore:', error);
    }
  };

  const enviarWhatsApp = async (e) => {
    e.preventDefault();

    if (!telefonoComercio) {
      alert(
        'Error: Este comercio no tiene configurado un número de WhatsApp para recibir pedidos.'
      );
      return;
    }

    setEnviando(true);
    try {
      await descontarStockEnFirestore(cart);

      const encabezado = obtenerEncabezadoVenta(cart, nombreComercio);
      const tipoVentaResumen = encabezado.replace(/\*/g, '');

      let mensaje = `${encabezado}\n\n`;
      mensaje += `*Cliente:* ${nombre}\n`;
      mensaje += `*Teléfono:* ${telefono}\n`;
      mensaje += `*Dirección:* ${direccion}\n\n`;
      mensaje += `*DETALLE DEL PEDIDO:*\n`;

      const itemsResumen = cart.map((item) => {
        const subtotalItem =
          Number(item.precioOferta || item.precio || 0) * Number(item.quantity);
        const notas = [];
        if (item.soloContado) {
          notas.push('Relámpago · Solo de contado');
        } else if (item.esOutlet) {
          notas.push('Outlet');
        } else {
          notas.push('Venta normal');
        }
        if (item.talle) notas.push(`Talle: ${item.talle}`);
        if (item.esPorPedido) {
          notas.push(item.demoraPedido ? `Por pedido · ${item.demoraPedido}` : 'Por pedido');
        }

        const extraTexto = notas.length > 0 ? ` [${notas.join(' · ')}]` : '';
        mensaje += `- ${item.quantity}x ${item.nombre}${extraTexto} ($${subtotalItem.toLocaleString(
          'es-AR'
        )})\n`;

        return {
          id: item.id || '',
          nombre: item.nombre || '',
          cantidad: Number(item.quantity) || 1,
          subtotal: subtotalItem,
          soloContado: Boolean(item.soloContado),
          esOutlet: Boolean(item.esOutlet),
          esPorPedido: Boolean(item.esPorPedido)
        };
      });

      mensaje += `\n*TOTAL A PAGAR: $${totalPrice.toLocaleString('es-AR')}*`;

      await registrarPedidoEnFirestore(itemsResumen, tipoVentaResumen);

      const cleanNumber = telefonoComercio.replace(/\D/g, '');
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(mensaje)}`;

      window.open(url, '_blank');
      clearCart();
      onClose();
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      alert('Ocurrió un problema al enviar el pedido. Intentá nuevamente.');
    } finally {
      setEnviando(false);
    }
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
            disabled={enviando}
            className={`w-full disabled:opacity-60 font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs md:text-sm tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 mt-2 cursor-pointer ${tema.botonPrimario}`}
          >
            {enviando ? 'Procesando pedido...' : 'Enviar Pedido por WhatsApp 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};