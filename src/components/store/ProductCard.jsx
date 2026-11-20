import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { obtenerTemaComercio } from '../../utils/temasComercio';

const IMAGEN_POR_DEFECTO = '/StoreGladius.png';

const leerColorTema = () => {
  try {
    const comercioLocal = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioLocal.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const ProductCard = ({
  product,
  vistaAdmin = false,
  onEditProduct,
  onDeleteProduct,
  onImageClick,
  colorTema,
  tema: temaProp
}) => {
  const { addToCart, cart, updateQuantity } = useCart();
  const [temaIdActual, setTemaIdActual] = useState(
    () => temaProp?.id || colorTema || leerColorTema()
  );

  useEffect(() => {
    if (temaProp?.id || colorTema) {
      setTemaIdActual(temaProp?.id || colorTema);
    }
  }, [temaProp?.id, colorTema]);

  useEffect(() => {
    const sincronizarTema = (evento) => {
      setTemaIdActual(
        evento?.detail?.colorTema || temaProp?.id || colorTema || leerColorTema()
      );
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarTema);
    window.addEventListener('valhalla:comercio-actualizado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarTema);
      window.removeEventListener('valhalla:comercio-actualizado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
    };
  }, [temaProp?.id, colorTema]);

  const tema = temaProp || obtenerTemaComercio(temaIdActual);

  // Normalizamos las imágenes del producto (máximo 3) manteniendo compatibilidad con product.imagen
  const imagenesProducto = (() => {
    const lista = Array.isArray(product.imagenes)
      ? product.imagenes.filter(Boolean)
      : product.imagen
      ? [product.imagen]
      : [];
    return lista.slice(0, 3);
  })();

  const [imagenActivaIdx, setImagenActivaIdx] = useState(0);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [modalCarruselLocal, setModalCarruselLocal] = useState(false);
  const [carruselLocalIdx, setCarruselLocalIdx] = useState(0);

  // Estado local para el talle seleccionado (si el producto usa talles)
  const [talleSeleccionado, setTalleSeleccionado] = useState(
    product.talles && product.talles.length > 0 ? product.talles[0] : ''
  );

  // Verificamos si el producto usa talles (por propiedad booleana o por tener array de talles)
  const usaTalles = product.usaTalles === true || (product.talles && product.talles.length > 0);
  const listaTalles = product.talles || ['S', 'M', 'L', 'XL', 'XXL'];

  // Normalizamos la ficha técnica básica (acepta objeto { Marca: '...', Material: '...' } o array [{ clave, valor }])
  const itemsFichaTecnica = (() => {
    if (Array.isArray(product.fichaTecnica)) {
      return product.fichaTecnica.filter((item) => item?.clave && item?.valor);
    }
    if (product.fichaTecnica && typeof product.fichaTecnica === 'object') {
      return Object.entries(product.fichaTecnica)
        .filter(([, valor]) => valor !== undefined && valor !== null && String(valor).trim() !== '')
        .map(([clave, valor]) => ({ clave, valor }));
    }
    return [];
  })();

  const tieneFicha =
    itemsFichaTecnica.length > 0 || Boolean(product.descripcion && product.descripcion.trim());

  // Si usa talles, buscamos en el carrito el item que coincida con el ID y el talle exacto
  const cartItem = cart.find(
    (item) => item.id === product.id && (usaTalles ? item.talle === talleSeleccionado : true)
  );

  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAgregar = () => {
    const imagenPrincipal = imagenesProducto[0] || product.imagen || IMAGEN_POR_DEFECTO;
    const productoConTalle = {
      ...product,
      imagen: imagenPrincipal,
      cartItemId: usaTalles ? `${product.id}-${talleSeleccionado}` : product.id,
      talle: usaTalles ? talleSeleccionado : null,
      nombre: usaTalles ? `${product.nombre} (Talle: ${talleSeleccionado})` : product.nombre
    };
    addToCart(productoConTalle);
  };

  const handleEditarClick = (e) => {
    e.stopPropagation();
    if (typeof onEditProduct === 'function') {
      onEditProduct(product);
    }
  };

  const handleEliminarClick = (e) => {
    e.stopPropagation();
    if (typeof onDeleteProduct === 'function') {
      onDeleteProduct(product);
    }
  };

  // Función auxiliar para formatear los precios sin centavos y con puntos (ej: 85000 -> 85.000)
  const formatearPrecio = (precio) => {
    const numero = Number(precio);
    if (isNaN(numero)) return precio;
    return numero.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const indiceSeguro = imagenActivaIdx < imagenesProducto.length ? imagenActivaIdx : 0;
  const imagenActual = imagenesProducto[indiceSeguro] || IMAGEN_POR_DEFECTO;
  const listaCarrusel = imagenesProducto.length > 0 ? imagenesProducto : [IMAGEN_POR_DEFECTO];

  const handleSiguienteImagen = (e) => {
    e.stopPropagation();
    if (imagenesProducto.length <= 1) return;
    setImagenActivaIdx((prev) => (prev + 1) % imagenesProducto.length);
  };

  const handleAnteriorImagen = (e) => {
    e.stopPropagation();
    if (imagenesProducto.length <= 1) return;
    setImagenActivaIdx((prev) => (prev - 1 + imagenesProducto.length) % imagenesProducto.length);
  };

  const handleAbrirAmpliada = () => {
    if (typeof onImageClick === 'function') {
      onImageClick(product, indiceSeguro);
      return;
    }
    setCarruselLocalIdx(indiceSeguro);
    setModalCarruselLocal(true);
  };

  return (
    <div
      className={`relative bg-white border-2 border-slate-200 ${tema.bordeHover} rounded-3xl p-2.5 sm:p-3.5 shadow-lg shadow-slate-100 flex flex-col justify-between transition-all group min-w-0`}
    >
      {product.etiqueta && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md z-10 whitespace-nowrap ${tema.badgeSolido}`}
        >
          {product.etiqueta}
        </span>
      )}

      {/* Botones Editar / Eliminar visibles solo en administración */}
      {vistaAdmin &&
        (typeof onEditProduct === 'function' || typeof onDeleteProduct === 'function') && (
          <div className="flex items-center justify-end gap-1 mb-1">
            {typeof onEditProduct === 'function' && (
              <button
                type="button"
                onClick={handleEditarClick}
                className={`inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${tema.textoEnlaceHover}`}
              >
                <i className="bx bx-edit-alt text-xs"></i>
                <span>Editar</span>
              </button>
            )}
            {typeof onDeleteProduct === 'function' && (
              <button
                type="button"
                onClick={handleEliminarClick}
                title={`Eliminar ${product.nombre}`}
                aria-label={`Eliminar ${product.nombre}`}
                className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl p-1 text-xs font-black transition-colors cursor-pointer"
              >
                <i className="bx bx-trash text-xs"></i>
              </button>
            )}
          </div>
        )}

      {/* Galería de hasta 3 imágenes */}
      <div className="my-1.5">
        <div
          onClick={handleAbrirAmpliada}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAbrirAmpliada();
            }
          }}
          title="Hacé clic para agrandar la imagen"
          className="relative w-full h-28 sm:h-32 md:h-36 flex items-center justify-center overflow-hidden bg-slate-50 rounded-2xl border border-slate-100 cursor-zoom-in"
        >
          <img
            src={imagenActual}
            alt={`${product.nombre} (${indiceSeguro + 1} de ${Math.max(imagenesProducto.length, 1)})`}
            className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300"
          />

          {imagenesProducto.length > 1 && (
            <>
              <button
                type="button"
                onClick={handleAnteriorImagen}
                aria-label="Imagen anterior"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center text-xs font-black cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleSiguienteImagen}
                aria-label="Siguiente imagen"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center text-xs font-black cursor-pointer"
              >
                ›
              </button>
              <span className="absolute bottom-1.5 right-2 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {indiceSeguro + 1}/{imagenesProducto.length}
              </span>
            </>
          )}
        </div>

        {/* Miniaturas seleccionables (hasta 3) */}
        {imagenesProducto.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {imagenesProducto.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setImagenActivaIdx(idx)}
                aria-label={`Ver imagen ${idx + 1}`}
                className={`w-8 h-8 rounded-lg overflow-hidden border-2 bg-slate-50 p-0.5 transition-all cursor-pointer ${
                  indiceSeguro === idx
                    ? `${tema.miniaturaActiva} scale-105 shadow-2xs`
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${product.nombre} miniatura ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <h3 className="text-xs font-black text-slate-800 text-center line-clamp-2 h-8 mb-1">
        {product.nombre}
      </h3>

      {/* Ficha técnica básica (siempre disponible en admin para agregar/ver; en catálogo público se muestra si tiene datos) */}
      {(tieneFicha || vistaAdmin) && (
        <div className="my-1.5">
          <button
            type="button"
            onClick={() => setMostrarFicha((prev) => !prev)}
            className={`w-full flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 transition-colors cursor-pointer ${tema.textoEnlaceHover}`}
          >
            <i className="bx bx-list-ul text-sm"></i>
            <span>
              {mostrarFicha
                ? 'Ocultar ficha técnica'
                : tieneFicha
                ? 'Ficha técnica'
                : '+ Ficha técnica'}
            </span>
          </button>

          {mostrarFicha && (
            <div className="mt-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-[11px] text-slate-700 space-y-1.5">
              {tieneFicha ? (
                <>
                  {product.descripcion && (
                    <p className="text-[11px] text-slate-600 leading-snug pb-1 border-b border-slate-200/80">
                      {product.descripcion}
                    </p>
                  )}
                  {itemsFichaTecnica.map((item, idx) => (
                    <div
                      key={`${item.clave}-${idx}`}
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="font-bold text-slate-500 capitalize">{item.clave}:</span>
                      <span className="font-black text-slate-800 text-right">{item.valor}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-[10px] text-slate-500 text-center">
                  Sin datos técnicos cargados todavía.
                </p>
              )}

              {vistaAdmin && typeof onEditProduct === 'function' && (
                <button
                  type="button"
                  onClick={handleEditarClick}
                  className={`w-full mt-1 bg-white border rounded-xl py-1 text-[10px] font-black uppercase tracking-wider cursor-pointer ${tema.botonContornoSuave}`}
                >
                  {tieneFicha ? 'Editar ficha técnica' : 'Agregar ficha técnica'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
                    ? `${tema.talleActivo} shadow-xs`
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {talle}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-2xl p-2 text-center my-2 ${tema.cajaPrecio}`}
      >
        {product.precioAnterior && (
          <span className="text-[10px] md:text-xs text-slate-400 line-through block font-medium">
            Antes: ${formatearPrecio(product.precioAnterior)}
          </span>
        )}
        <span
          className={`text-base sm:text-xl md:text-2xl font-black tracking-tight leading-none block ${tema.textoAcento}`}
        >
          ${formatearPrecio(product.precioOferta || product.precio)}
        </span>
      </div>

      <div className="mt-1">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={handleAgregar}
            className={`w-full font-black text-xs py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-2xl shadow-md uppercase flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${tema.botonPrimario}`}
          >
            <i className="bx bx-cart-add text-base"></i> Agregar
          </button>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => updateQuantity(cartItem.cartItemId || product.id, -1)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold w-7 h-7 rounded-xl flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            >
              -
            </button>
            <span className="font-black text-sm text-slate-800">{quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(cartItem.cartItemId || product.id, 1)}
              className={`font-bold w-7 h-7 rounded-xl flex items-center justify-center shadow-xs cursor-pointer transition-colors ${tema.botonPrimario}`}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Respaldo de carrusel ampliado si se usa ProductCard sin prop onImageClick */}
      {modalCarruselLocal && (
        <div
          onClick={() => setModalCarruselLocal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 relative"
          >
            <button
              type="button"
              onClick={() => setModalCarruselLocal(false)}
              aria-label="Cerrar imagen ampliada"
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-slate-900 pr-10 mb-3">
              {product.nombre} ({carruselLocalIdx + 1}/{listaCarrusel.length})
            </h3>

            <div className="relative w-full h-64 sm:h-72 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
              {listaCarrusel.map((url, idx) => (
                <img
                  key={`${idx}-${url.slice(0, 24)}`}
                  src={url || IMAGEN_POR_DEFECTO}
                  alt={`${product.nombre} - imagen ${idx + 1}`}
                  className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-700 ease-in-out ${
                    carruselLocalIdx === idx
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                />
              ))}

              {listaCarrusel.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCarruselLocalIdx(
                        (prev) => (prev - 1 + listaCarrusel.length) % listaCarrusel.length
                      )
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center font-black cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCarruselLocalIdx((prev) => (prev + 1) % listaCarrusel.length)
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center font-black cursor-pointer"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {listaCarrusel.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                {listaCarrusel.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarruselLocalIdx(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 bg-slate-50 p-0.5 cursor-pointer ${
                      carruselLocalIdx === idx
                        ? tema.miniaturaActiva
                        : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};