import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product }) => {
  const { addToCart, cart, updateQuantity } = useCart();
  
  // Estado local para el talle seleccionado (si el producto usa talles)
  const [talleSeleccionado, setTalleSeleccionado] = useState(
    product.talles && product.talles.length > 0 ? product.talles[0] : ''
  );

  // Verificamos si el producto usa talles (por propiedad booleana o por tener array de talles)
  const usaTalles = product.usaTalles === true || (product.talles && product.talles.length > 0);
  const listaTalles = product.talles || ['S', 'M', 'L', 'XL', 'XXL']; // Talles por defecto si es indumentaria/zapatillas genéricas

  // Si usa talles, buscamos en el carrito el item que coincida con el ID y el talle exacto
  const cartItem = cart.find((item) => 
    item.id === product.id && (usaTalles ? item.talle === talleSeleccionado : true)
  );
  
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAgregar = () => {
    const productoConTalle = {
      ...product,
      // Identificador único en el carrito si maneja talle
      cartItemId: usaTalles ? `${product.id}-${talleSeleccionado}` : product.id,
      talle: usaTalles ? talleSeleccionado : null,
      nombre: usaTalles ? `${product.nombre} (Talle: ${talleSeleccionado})` : product.nombre
    };
    addToCart(productoConTalle);
  };

  // Función auxiliar para formatear los precios sin centavos y con puntos (ej: 85000 -> 85.000)
  const formatearPrecio = (precio) => {
    const numero = Number(precio);
    if (isNaN(numero)) return precio;
    return numero.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="relative bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-3.5 shadow-lg shadow-slate-100 flex flex-col justify-between transition-all group">
      {product.etiqueta && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md z-10">
          {product.etiqueta}
        </span>
      )}

      <div className="w-full h-32 md:h-36 flex items-center justify-center overflow-hidden my-2 bg-slate-50 rounded-2xl border border-slate-100">
        <img 
          src={product.imagen} 
          alt={product.nombre} 
          className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300" 
        />
      </div>

      <h3 className="text-xs font-black text-slate-800 text-center line-clamp-2 h-8 mb-1">
        {product.nombre}
      </h3>

      {/* 🟢 SELECTOR DE TALLES (Si el producto lo requiere) */}
      {usaTalles && (
        <div className="my-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 text-center">
            Seleccioná el talle:
          </label>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {listaTalles.map((talle) => (
              <button
                key={talle}
                type="button"
                onClick={() => setTalleSeleccionado(talle)}
                className={`px-2 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                  talleSeleccionado === talle
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {talle}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-emerald-50/60 border-2 border-dashed border-emerald-200 rounded-2xl p-2 text-center my-2">
        {product.precioAnterior && (
          <span className="text-[10px] md:text-xs text-slate-400 line-through block font-medium">
            Antes: ${formatearPrecio(product.precioAnterior)}
          </span>
        )}
        <span className="text-xl md:text-2xl font-black text-emerald-800 tracking-tight leading-none block">
          ${formatearPrecio(product.precioOferta || product.precio)}
        </span>
      </div>

      <div className="mt-1">
        {quantity === 0 ? (
          <button
            onClick={handleAgregar}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 px-3 rounded-2xl shadow-md shadow-emerald-600/20 uppercase flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <i className='bx bx-cart-add text-base'></i> Agregar
          </button>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
            <button
              onClick={() => updateQuantity(cartItem.cartItemId || product.id, -1)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold w-7 h-7 rounded-xl flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            >
              -
            </button>
            <span className="font-black text-sm text-slate-800">{quantity}</span>
            <button
              onClick={() => updateQuantity(cartItem.cartItemId || product.id, 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-7 h-7 rounded-xl flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};