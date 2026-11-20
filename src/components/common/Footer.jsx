import React, { useState, useEffect } from 'react';
import { obtenerTemaComercio } from '../../utils/temasComercio';

const leerColorTemaGuardado = (colorTemaProp) => {
  if (colorTemaProp) return colorTemaProp;
  try {
    const comercioGuardado = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioGuardado.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const Footer = ({ colorTema }) => {
  const [temaIdActual, setTemaIdActual] = useState(() => leerColorTemaGuardado(colorTema));

  useEffect(() => {
    setTemaIdActual(leerColorTemaGuardado(colorTema));
  }, [colorTema]);

  useEffect(() => {
    const sincronizarTema = (evento) => {
      const nuevoTema = evento?.detail?.colorTema || leerColorTemaGuardado();
      setTemaIdActual(nuevoTema);
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
    };
  }, []);

  const tema = obtenerTemaComercio(temaIdActual);

  return (
    <footer
      className={`bg-slate-900/90 backdrop-blur-md text-slate-400 text-center py-6 px-4 mt-12 border-t-2 ${tema.bordeDestacado} text-xs shadow-lg w-full max-w-full overflow-x-clip transition-colors duration-200`}
    >
      <p className="font-bold text-slate-200">
        Valhalla Store - Catálogo Digital con WhatsApp y Google Maps
      </p>
      <p className="mt-1">
        Desarrollado de forma independiente 🚀
      </p>
    </footer>
  );
};