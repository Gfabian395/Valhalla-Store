import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const Navbar = ({ vistaAdmin, setVistaAdmin, onLogout }) => {
  const { totalItems } = useCart();

  const alternarVista = () => {
    if (typeof setVistaAdmin === 'function') {
      setVistaAdmin(!vistaAdmin);
    } else {
      console.warn("setVistaAdmin no está definido en el componente padre.");
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md text-white sticky top-0 z-40 shadow-lg border-b-4 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-yellow-400 text-slate-900 font-black p-2 rounded-xl text-base md:text-lg shadow">
            <i className='bx bxs-store-alt'></i>
          </div>
          <div>
            <span className="text-lg md:text-xl font-black tracking-wider text-yellow-400 block leading-none">VALHALLA</span>
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-slate-300 uppercase">SaaS Multi-Comercio</span>
          </div>
        </Link>

        {/* Acciones de Navegación, Carrito y Sesión */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={alternarVista}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer ${
              vistaAdmin 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400' 
                : 'bg-slate-800 hover:bg-slate-700 border border-yellow-400/50 text-yellow-400'
            }`}
          >
            <i className={`bx ${vistaAdmin ? 'bx-show text-sm' : 'bx-cog text-base'} text-yellow-300`}></i>
            <span>{vistaAdmin ? "Ver Mi Catálogo (Vista Cliente)" : "Panel Admin"}</span>
          </button>

          {!vistaAdmin && (
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-2.5 md:px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <i className='bx bx-cart text-yellow-400 text-lg md:text-xl'></i>
              <span className="text-[11px] md:text-xs font-bold">{totalItems} ítems</span>
            </div>
          )}

          {/* Botón de Cerrar Sesión (Siempre visible en el Navbar) */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              title="Cerrar Sesión"
            >
              <i className='bx bx-log-out text-base'></i>
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};