import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ProductCard } from '../components/store/ProductCard';
import { CategoryNav } from '../components/store/CategoryNav';
import { CartDrawer } from '../components/store/CartDrawer'; // 🟢 Carrito flotante inferior
import { CheckoutModal } from '../components/modals/CheckoutModal'; // 🟢 Modal de envío a WhatsApp
import { useCart } from '../context/CartContext';
import { obtenerTemaComercio } from '../utils/temasComercio';

const BANNER_POR_DEFECTO = '/StoreGladius.png';
const MAX_IMAGENES_PRODUCTO = 3;

const obtenerImagenesProducto = (product) => {
  if (!product) return [];
  const lista = Array.isArray(product.imagenes)
    ? product.imagenes.filter(Boolean)
    : product.imagen
    ? [product.imagen]
    : [];
  return lista.slice(0, MAX_IMAGENES_PRODUCTO);
};

export const CatalogoPublico = () => {
  const { storeId } = useParams(); // Obtenemos el ID del comercio desde la URL
  const { totalItems } = useCart();

  const [comercio, setComercio] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(['Todos']);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todos');
  const [errorTienda, setErrorTienda] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  // Estado del carrusel ampliado al hacer clic en una imagen de producto
  const [carruselProducto, setCarruselProducto] = useState(null);
  const [carruselIdx, setCarruselIdx] = useState(0);

  // 🟢 Estado para abrir y cerrar el modal de checkout (WhatsApp)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchTiendaPublica = async () => {
      if (!storeId) {
        setErrorTienda(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setBannerError(false);
        setFiltroCat('Todos');

        // 1. Buscamos los datos generales del comercio en la colección 'comercios'
        const comercioDocRef = doc(db, 'comercios', storeId);
        const comercioSnap = await getDoc(comercioDocRef);

        if (comercioSnap.exists()) {
          setComercio({ id: comercioSnap.id, ...comercioSnap.data() });
        } else {
          setErrorTienda(true);
          setLoading(false);
          return;
        }

        // 2. Obtenemos los productos de este comercio específico
        const prodSnapshot = await getDocs(collection(db, 'comercios', storeId, 'productos'));
        const listaProds = prodSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));
        setProductos(listaProds);

        // 3. Obtenemos las categorías de este comercio específico
        const catSnapshot = await getDocs(collection(db, 'comercios', storeId, 'categorias'));
        const listaCats = catSnapshot.docs.map((item) => item.data().nombre).filter(Boolean);
        setCategorias(['Todos', ...listaCats]);
      } catch (error) {
        console.error('Error al cargar la tienda pública:', error);
        setErrorTienda(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTiendaPublica();
  }, [storeId]);

  const tema = obtenerTemaComercio(comercio?.colorTema || 'emerald');

  const handleAbrirCarrusel = (product, indiceInicial = 0) => {
    const imgs = obtenerImagenesProducto(product);
    if (imgs.length === 0) return;
    const idxValido = indiceInicial >= 0 && indiceInicial < imgs.length ? indiceInicial : 0;
    setCarruselProducto(product);
    setCarruselIdx(idxValido);
  };

  const handleCerrarCarrusel = () => {
    setCarruselProducto(null);
    setCarruselIdx(0);
  };

  const handleCarruselAnterior = () => {
    if (!carruselProducto) return;
    const imgs = obtenerImagenesProducto(carruselProducto);
    if (imgs.length <= 1) return;
    setCarruselIdx((prev) => (prev - 1 + imgs.length) % imgs.length);
  };

  const handleCarruselSiguiente = () => {
    if (!carruselProducto) return;
    const imgs = obtenerImagenesProducto(carruselProducto);
    if (imgs.length <= 1) return;
    setCarruselIdx((prev) => (prev + 1) % imgs.length);
  };

  const productosFiltrados =
    filtroCat === 'Todos'
      ? productos
      : productos.filter(
          (p) => p.categoria?.trim().toLowerCase() === filtroCat.trim().toLowerCase()
        );

  // Soporta bannerUrl o banner en el documento del comercio
  const urlBannerComercio = (comercio?.bannerUrl || comercio?.banner || '').trim();
  const bannerSrc = !bannerError && urlBannerComercio ? urlBannerComercio : BANNER_POR_DEFECTO;
  const nombreTienda = comercio?.name || comercio?.nombre || 'Tienda Digital';

  const imagenesCarruselActual = obtenerImagenesProducto(carruselProducto);
  const slidesCarrusel =
    imagenesCarruselActual.length > 0 ? imagenesCarruselActual : [BANNER_POR_DEFECTO];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className={`font-bold text-xs uppercase tracking-widest animate-pulse ${tema.loaderTexto}`}>
          Cargando Catálogo Digital...
        </p>
      </div>
    );
  }

  if (errorTienda) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-3 shadow-sm">
          <i className="bx bx-store-alt text-3xl"></i>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-1">Comercio no encontrado</h2>
        <p className="text-xs text-slate-500 mb-6">
          El enlace al catálogo que intentaste abrir no existe o la tienda no está disponible.
        </p>
        <Link
          to="/"
          className={`font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg ${tema.botonPrimario}`}
        >
          Ir a Valhalla Store 🚀
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 text-slate-900 pb-28">
      {/* Navbar Superior Público para el Cliente */}
      <header
        className={`bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs border-b-2 ${tema.bordeDestacado}`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 shadow-inner ${tema.iconoSuave}`}
            >
              <img
                src="/StoreGladius.png"
                alt={nombreTienda}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span
                className={`text-base sm:text-lg md:text-xl font-black tracking-wider block leading-none truncate ${tema.textoAcento}`}
              >
                {nombreTienda}
              </span>
              <span className="text-[10px] md:text-xs font-bold tracking-widest text-slate-400 uppercase block truncate">
                Catálogo Oficial
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`border px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${tema.badgeSuave}`}
            >
              <i className={`bx bx-cart text-lg sm:text-xl ${tema.loaderTexto}`}></i>
              <span className="text-[11px] sm:text-xs font-black">
                {totalItems} <span className="hidden sm:inline">ítems</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido del Catálogo */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-w-0">
        {/* Banner Personalizado del Comercio */}
        <section
          aria-label={`Banner de ${nombreTienda}`}
          className="relative w-full h-36 sm:h-56 md:h-64 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs mb-4 sm:mb-6"
        >
          <img
            src={bannerSrc}
            alt={`Banner de ${nombreTienda}`}
            onError={() => setBannerError(true)}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/20 to-transparent flex items-end p-3.5 sm:p-6 min-w-0">
            <div className="min-w-0">
              <p
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate ${tema.subtituloBanner}`}
              >
                Tienda Oficial
              </p>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight truncate">
                {nombreTienda}
              </h1>
            </div>
          </div>
        </section>

        {/* Navegación de Categorías */}
        <CategoryNav
          categorias={categorias}
          categoriaSeleccionada={filtroCat}
          onSelectCategoria={setFiltroCat}
          vistaAdmin={false}
          colorTema={tema.id}
          tema={tema}
        />

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mt-6">
            <p className="text-slate-600 font-bold text-sm">
              No hay productos cargados en esta categoría actualmente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 mt-6 min-w-0">
            {productosFiltrados.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                colorTema={tema.id}
                tema={tema}
                onImageClick={handleAbrirCarrusel}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal Carrusel Ampliado con Transición Suave de Desvanecimiento */}
      {carruselProducto && (
        <div
          onClick={handleCerrarCarrusel}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-5 md:p-6 shadow-2xl border border-slate-200 relative"
          >
            <button
              type="button"
              onClick={handleCerrarCarrusel}
              aria-label="Cerrar visor de imágenes"
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="pr-10 mb-3">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${tema.badgeSuave}`}
              >
                Galería ({carruselIdx + 1} / {slidesCarrusel.length})
              </span>
              <h3 className="text-base md:text-lg font-black text-slate-900 mt-1.5">
                {carruselProducto.nombre}
              </h3>
            </div>

            <div className="relative w-full h-64 sm:h-80 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              {slidesCarrusel.map((imgUrl, idx) => {
                const esActiva = idx === carruselIdx;
                return (
                  <img
                    key={`${idx}-${imgUrl.slice(0, 24)}`}
                    src={imgUrl}
                    alt={`${carruselProducto.nombre} - imagen ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-700 ease-in-out ${
                      esActiva ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  />
                );
              })}

              {slidesCarrusel.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleCarruselAnterior}
                    aria-label="Imagen anterior en carrusel"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center text-lg font-black cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleCarruselSiguiente}
                    aria-label="Siguiente imagen en carrusel"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center text-lg font-black cursor-pointer"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {slidesCarrusel.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-4">
                {slidesCarrusel.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarruselIdx(idx)}
                    aria-label={`Seleccionar imagen ${idx + 1}`}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-slate-50 p-1 transition-all cursor-pointer ${
                      carruselIdx === idx
                        ? `${tema.miniaturaActiva} scale-105 shadow-xs`
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {carruselProducto.descripcion && (
              <p className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-3 leading-relaxed">
                {carruselProducto.descripcion}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 🟢 CARRITO FLOTANTE CON EFECTO GLASS & BLUR */}
      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        colorTema={tema.id}
        tema={tema}
      />

      {/* 🟢 MODAL DE CHECKOUT Y DATOS DE ENVÍO PARA WHATSAPP */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        colorTema={tema.id}
      />
    </div>
  );
};