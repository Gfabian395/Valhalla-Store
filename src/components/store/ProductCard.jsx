import React from 'react';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product }) => {
  const { addToCart, cart, updateQuantity } = useCart();
  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-yellow-400/80 rounded-2xl p-3 shadow-lg flex flex-col justify-between hover:border-red-600 transition-all">
      {product.etiqueta && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow z-10">
          {product.etiqueta}
        </span>
      )}

      <div className="w-full h-32 md:h-36 flex items-center justify-center overflow-hidden my-2 bg-slate-50/50 rounded-xl">
        <img 
          src={product.imagen} 
          alt={product.nombre} 
          className="object-contain h-full w-full hover:scale-105 transition-transform duration-300" 
        />
      </div>

      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 text-center line-clamp-2 h-8 mb-2">
        {product.nombre}
      </h3>

      <div className="bg-red-50/80 dark:bg-red-950/30 border-2 border-dashed border-red-300 rounded-xl p-2 text-center my-1">
        {product.precioAnterior && (
          <span className="text-[10px] md:text-xs text-slate-400 line-through block">
            Antes: ${product.precioAnterior}
          </span>
        )}
        <span className="text-xl md:text-2xl font-black text-red-600 dark:text-red-400 tracking-tight leading-none block">
          ${product.precioOferta}
        </span>
      </div>

      <div className="mt-2">
        {quantity === 0 ? (
          <button
            onClick={() => addToCart(product)}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black text-xs py-2 px-3 rounded-xl shadow uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <i className='bx bx-cart-add text-base'></i> Agregar
          </button>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => updateQuantity(product.id, -1)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold w-7 h-7 rounded-lg flex items-center justify-center shadow cursor-pointer"
            >
              -
            </button>
            <span className="font-black text-sm text-slate-800 dark:text-slate-100">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, 1)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold w-7 h-7 rounded-lg flex items-center justify-center shadow cursor-pointer"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};