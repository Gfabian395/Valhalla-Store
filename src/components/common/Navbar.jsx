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

  // URL actual única e irrepetible de este comercio para la plataforma SaaS multi-tenant
  const currentUrl = window.location.href.split('?')[0];
  
  // Generación del código QR único de alta resolución basado en la ruta de la tienda actual
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentUrl)}`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <>
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

      {/* 🟢 MODAL FOLLETO PROFESIONAL AMPLIADO A PANTALLA GRANDE */}
      {modalCompartirOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 transition-all duration-300 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-100 relative my-auto">
            
            <button 
              onClick={() => setModalCompartirOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-9 h-9 rounded-full flex items-center justify-center font-bold text-base transition-colors cursor-pointer z-20"
            >
              ✕
            </button>

            {/* Encabezado del Modal */}
            <div className="text-center mb-5">
              <span className="text-[11px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 inline-block mb-2">
                Folleto SaaS Multicomercio 🛡️
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Compartí tu Catálogo
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Código QR único e irrepetible para que tus clientes accedan directo a tus productos sin registros.
              </p>
            </div>

            {/* CONTENEDOR PRINCIPAL GIGANTE: Gladiador con QR integrado en el pedestal */}
            <div className="bg-gradient-to-b from-emerald-50/40 to-slate-50 border border-emerald-100 rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center relative shadow-inner">
              
              {/* Contenedor de gran tamaño responsivo para que el gladiador destaque */}
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center my-2">
                <img 
                  src="/GladiusQR.png" 
                  alt="Gladiador Presentando QR" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                  onError={(e) => {
                    e.target.src = "/StoreGladius.png"; // Fallback por seguridad
                  }}
                />
                
                {/* 🟢 QR ÚNICO GIGANTE E INYECTADO EXACTAMENTE SOBRE EL PEDESTAL */}
                <div className="absolute top-[34%] left-[12%] bg-white p-2.5 rounded-2xl shadow-2xl border-2 border-emerald-500/50">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Único del Comercio" 
                    className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-xl bg-white"
                  />
                </div>
              </div>

              <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-white px-4 py-1.5 rounded-full border border-emerald-200 shadow-xs mt-3">
                📱 Escaneá con cualquier celular
              </span>
            </div>

            {/* Enlace Directo y Botón Copiar */}
            <div className="space-y-3 mt-6">
              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-slate-700 font-mono truncate select-all text-center shadow-inner">
                {currentUrl}
              </div>

              <button
                onClick={copiarEnlace}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <i className={`bx ${copiado ? 'bx-check text-xl' : 'bx-copy text-xl'}`}></i>
                {copiado ? "¡Enlace Copiado al Portapapeles!" : "Copiar Enlace de Mi Tienda 🚀"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};