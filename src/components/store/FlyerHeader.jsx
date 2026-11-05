import React from 'react';

export const FlyerHeader = () => {
  return (
    <div className="bg-linear-to-r from-red-600 via-orange-600 to-yellow-500 rounded-3xl p-4 md:p-6 text-white shadow-xl mb-6 text-center border-4 border-yellow-300 backdrop-blur-md">
      <span className="bg-white/90 backdrop-blur text-red-600 text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow">
        Precios Vigentes de Oferta
      </span>
      <h1 className="text-2xl md:text-5xl font-black tracking-wider uppercase mt-2 drop-shadow-md">
        ¡Super Ofertas Semanales!
      </h1>
      <p className="text-xs md:text-sm font-medium mt-1 text-yellow-100">
        Aprovechá los mejores precios del mercado directo a tu WhatsApp. ¡Hasta agotar stock!
      </p>
    </div>
  );
};