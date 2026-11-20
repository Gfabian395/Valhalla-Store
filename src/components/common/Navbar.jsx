import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { obtenerTemaComercio } from '../../utils/temasComercio';

const leerComercioGuardado = () => {
  try {
    return JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
  } catch {
    return {};
  }
};

export const Navbar = ({ vistaAdmin, onLogout, colorTema }) => {
  const { totalItems } = useCart();
  const [modalCompartirOpen, setModalCompartirOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [comercioSync, setComercioSync] = useState(() => leerComercioGuardado());

  useEffect(() => {
    const sincronizarComercio = (evento) => {
      const actual = leerComercioGuardado();
      if (evento?.detail?.colorTema) {
        setComercioSync({ ...actual, colorTema: evento.detail.colorTema });
      } else {
        setComercioSync(actual);
      }
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarComercio);
    window.addEventListener('valhalla:comercio-actualizado', sincronizarComercio);
    window.addEventListener('storage', sincronizarComercio);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarComercio);
      window.removeEventListener('valhalla:comercio-actualizado', sincronizarComercio);
      window.removeEventListener('storage', sincronizarComercio);
    };
  }, []);

  // 🔴 SAAS MULTI-TENANT: Obtenemos el ID único del comercio desde localStorage
  const storeId =
    localStorage.getItem('valhalla_store_id') ||
    localStorage.getItem('valhallastore_id') ||
    '';

  const nombreComercio =
    comercioSync.name || comercioSync.nombreComercio || 'Tienda';
  const tema = obtenerTemaComercio(colorTema || comercioSync.colorTema || 'emerald');

  // Construimos la URL pública y única del catálogo de este tenant específico
  const baseUrl = window.location.origin; // Ej: https://valhallastore.vercel.app
  const currentUrl = storeId ? `${baseUrl}/store/${storeId}` : baseUrl;

  // Generación del código QR único de alta resolución basado en la URL pública de la tienda
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
    currentUrl
  )}`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <>
      {/* 🟢 ESTILOS DE IMPRESIÓN: Compactos para garantizar que salga exactamente en 1 sola hoja A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area-exclusive, #print-area-exclusive * {
            visibility: visible !important;
          }
          #print-area-exclusive {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 100% !important;
            max-width: 450px !important;
            margin: 0 !important;
            padding: 10px !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <header
        className={`bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 shadow-md border-b-2 ${tema.bordeDestacado} w-full max-w-full overflow-x-clip transition-colors duration-200`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
          {/* Logo con el Gladiador */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 shadow-inner ${tema.iconoSuave}`}
            >
              <img
                src="/StoreGladius.png"
                alt="Valhalla Store Gladiador"
                className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <span
                className={`text-sm sm:text-lg md:text-xl font-black tracking-wider block leading-none whitespace-nowrap ${tema.textoAcento}`}
              >
                VALHALLA
              </span>
              <span className="hidden xs:block sm:block text-[9px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap">
                Store Digital
              </span>
            </div>
          </Link>

          {/* Acciones de Compartir, Carrito y Sesión */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            {/* 🟢 BOTÓN FOLLETO / COMPARTIR CATÁLOGO (QR & LINK) */}
            <button
              type="button"
              onClick={() => setModalCompartirOpen(true)}
              className={`border px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${tema.botonContornoSuave}`}
              title="Compartir Catálogo (QR y Enlace)"
            >
              <i className="bx bx-qr text-sm sm:text-base"></i>
              <span className="hidden sm:inline">Compartir</span>
            </button>

            {!vistaAdmin && (
              <div className="bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap shrink-0">
                <i className={`bx bx-cart text-base sm:text-xl ${tema.loaderTexto}`}></i>
                <span className="text-[10px] sm:text-xs font-black text-slate-800">
                  {totalItems} <span className="hidden sm:inline">ítems</span>
                </span>
              </div>
            )}

            {/* Botón de Cerrar Sesión */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                title="Cerrar Sesión"
              >
                <i className="bx bx-log-out text-sm sm:text-base"></i>
                <span className="hidden md:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 🟢 MODAL FOLLETO PROFESIONAL AMPLIADO, RESPONSIVO Y CON ZONA DE IMPRESIÓN AISLADA */}
      {modalCompartirOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 transition-all duration-300 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-4xl w-full p-5 sm:p-8 shadow-2xl border border-slate-100 relative my-auto">
            <button
              type="button"
              onClick={() => setModalCompartirOpen(false)}
              className="no-print absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors cursor-pointer z-20 shadow-xs"
            >
              ✕
            </button>

            {/* Encabezado del Modal (Visible en pantalla normal) */}
            <div className="no-print text-center mb-4 sm:mb-5">
              <span
                className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-3.5 py-1 rounded-full border inline-block mb-1.5 shadow-2xs ${tema.badgeSuave}`}
              >
                Folleto Multicomercio 🛡️ ({nombreComercio})
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Compartí tu Catálogo
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Código QR único e irrepetible para que tus clientes accedan directo a tus productos sin registros.
              </p>
            </div>

            {/* 🟢 ZONA EXCLUSIVA DE IMPRESIÓN (Contiene solo el título de la tienda, el Gladiador y su QR) */}
            <div
              id="print-area-exclusive"
              className={`bg-linear-to-b from-slate-50 to-white border-2 ${tema.cajaPrecio} rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative shadow-inner`}
            >
              {/* Título de la tienda solo visible al imprimir */}
              <div className="hidden print:block text-center mb-2">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
                  {nombreComercio}
                </h1>
                <p
                  className={`text-xs font-bold tracking-widest uppercase ${tema.loaderTexto}`}
                >
                  Escaneá para ver el Catálogo Digital
                </p>
              </div>

              {/* Contenedor responsivo grande para apreciar al gladiador */}
              <div className="relative w-full max-w-70 sm:max-w-100 aspect-square flex items-center justify-center my-1">
                <img
                  src="/GladiusQR.png"
                  alt="Gladiador Presentando QR"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  onError={(e) => {
                    e.target.src = '/StoreGladius.png'; // Fallback por seguridad
                  }}
                />

                {/* 🟢 QR ÚNICO CALIBRADO EXACTAMENTE SOBRE EL PEDESTAL DE LA IMAGEN */}
                <div
                  className={`absolute top-[38%] left-[16%] w-[38%] h-[38%] bg-white p-1.5 sm:p-2 rounded-2xl shadow-2xl border-2 ${tema.bordeDestacado} flex items-center justify-center`}
                >
                  <img
                    src={qrCodeUrl}
                    alt="QR Único del Comercio"
                    className="w-full h-full object-contain rounded-xl bg-white"
                  />
                </div>
              </div>

              <span
                className={`text-[11px] sm:text-sm font-bold bg-white px-4 py-1.5 rounded-full border shadow-xs mt-3 ${tema.badgeSuave}`}
              >
                📱 Escaneá con cualquier celular
              </span>
            </div>

            {/* Acciones: Enlace Directo, Copiar e Imprimir (Ocultos al imprimir) */}
            <div className="space-y-3 mt-4 sm:mt-5">
              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-700 font-mono truncate select-all text-center shadow-inner font-bold">
                {currentUrl}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print">
                <button
                  type="button"
                  onClick={copiarEnlace}
                  className={`w-full font-black py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${tema.botonPrimario}`}
                >
                  <i className={`bx ${copiado ? 'bx-check text-lg' : 'bx-copy text-lg'}`}></i>
                  {copiado ? '¡Enlace Copiado!' : 'Copiar Enlace 🚀'}
                </button>

                <button
                  type="button"
                  onClick={handleImprimir}
                  className={`w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 font-black py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ${tema.subtituloBanner}`}
                >
                  <i className="bx bx-printer text-lg"></i>
                  Imprimir Folleto QR 🖨️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};