import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const Navbar = ({ vistaAdmin, setVistaAdmin, onLogout }) => {
  const { totalItems } = useCart();
  const [modalCompartirOpen, setModalCompartirOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const alternarVista = () => {
    if (typeof setVistaAdmin === 'function') {
      setVistaAdmin(!vistaAdmin);
    } else {
      console.warn("setVistaAdmin no está definido en el componente padre.");
    }
  };

  // 🔴 SAAS MULTI-TENANT: Obtenemos el ID único del comercio desde localStorage
  const storeId = localStorage.getItem('valhalla_store_id') || localStorage.getItem('valhallastore_id') || '';
  
  // Leemos los datos del comercio guardados para obtener su nombre
  const comercioGuardado = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
  const nombreComercio = comercioGuardado.name || "Tienda";

  // Construimos la URL pública y única del catálogo de este tenant específico
  const baseUrl = window.location.origin; // Ej: https://valhallastore.vercel.app
  const currentUrl = storeId ? `${baseUrl}/store/${storeId}` : baseUrl;
  
  // Generación del código QR único de alta resolución basado en la URL pública de la tienda
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(currentUrl)}`;

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

      <header className="bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 shadow-md border-b-2 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          
          {/* Logo con el Gladiador */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img 
                src="/StoreGladius.png" 
                alt="Valhalla Store Gladiador" 
                className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-lg md:text-xl font-black tracking-wider text-emerald-800 block leading-none">VALHALLA</span>
              <span className="text-[10px] md:text-xs font-bold tracking-widest text-slate-400 uppercase">Store Digital</span>
            </div>
          </Link>

          {/* Acciones de Navegación, Compartir, Carrito y Sesión */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* 🟢 BOTÓN FOLLETO / COMPARTIR CATÁLOGO (QR & LINK) */}
            <button
              onClick={() => setModalCompartirOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Compartir Catálogo (QR y Enlace)"
            >
              <i className='bx bx-qr text-base'></i>
              <span className="hidden sm:inline">Compartir</span>
            </button>

            <button
              onClick={alternarVista}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                vistaAdmin 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600' 
                  : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
              }`}
            >
              <i className={`bx ${vistaAdmin ? 'bx-show text-sm' : 'bx-cog text-base'} ${vistaAdmin ? 'text-white' : 'text-emerald-700'}`}></i>
              <span>{vistaAdmin ? "Ver Mi Catálogo" : "Panel Admin"}</span>
            </button>

            {!vistaAdmin && (
              <div className="bg-slate-100 border border-slate-200 px-2.5 md:px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <i className='bx bx-cart text-emerald-700 text-lg md:text-xl'></i>
                <span className="text-[11px] md:text-xs font-black text-slate-800">{totalItems} ítems</span>
              </div>
            )}

            {/* Botón de Cerrar Sesión */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                title="Cerrar Sesión"
              >
                <i className='bx bx-log-out text-base'></i>
                <span className="hidden sm:inline">Salir</span>
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
              onClick={() => setModalCompartirOpen(false)} 
              className="no-print absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors cursor-pointer z-20 shadow-xs"
            >
              ✕
            </button>

            {/* Encabezado del Modal (Visible en pantalla normal) */}
            <div className="no-print text-center mb-4 sm:mb-5">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 inline-block mb-1.5 shadow-2xs">
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
            <div id="print-area-exclusive" className="bg-linear-to-b from-emerald-50/50 to-slate-50 border-2 border-emerald-100 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative shadow-inner">
              
              {/* Título de la tienda solo visible al imprimir */}
              <div className="hidden print:block text-center mb-2">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">{nombreComercio}</h1>
                <p className="text-xs font-bold text-emerald-700 tracking-widest uppercase">Escaneá para ver el Catálogo Digital</p>
              </div>

              {/* Contenedor responsivo grande para apreciar al gladiador */}
              <div className="relative w-full max-w-70] sm:max-w-100 aspect-square flex items-center justify-center my-1">
                <img 
                  src="/GladiusQR.png" 
                  alt="Gladiador Presentando QR" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                  onError={(e) => {
                    e.target.src = "/StoreGladius.png"; // Fallback por seguridad
                  }}
                />
                
                {/* 🟢 QR ÚNICO CALIBRADO EXACTAMENTE SOBRE EL PEDESTAL DE LA IMAGEN */}
                <div className="absolute top-[38%] left-[16%] w-[38%] h-[38%] bg-white p-1.5 sm:p-2 rounded-2xl shadow-2xl border-2 border-emerald-500/60 flex items-center justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Único del Comercio" 
                    className="w-full h-full object-contain rounded-xl bg-white"
                  />
                </div>
              </div>

              <span className="text-[11px] sm:text-sm font-bold text-emerald-800 bg-white px-4 py-1.5 rounded-full border border-emerald-200 shadow-xs mt-3">
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
                  onClick={copiarEnlace}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <i className={`bx ${copiado ? 'bx-check text-lg' : 'bx-copy text-lg'}`}></i>
                  {copiado ? "¡Enlace Copiado!" : "Copiar Enlace 🚀"}
                </button>

                <button
                  onClick={handleImprimir}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-black py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <i className='bx bx-printer text-lg'></i>
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