import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ProductCard } from '../components/store/ProductCard';
import { CategoryNav } from '../components/store/CategoryNav';
import { CartDrawer } from '../components/store/CartDrawer'; // 🟢 Carrito flotante inferior
import { CheckoutModal } from '../components/modals/CheckoutModal'; // 🟢 Modal de envío a WhatsApp
import { useCart } from '../context/CartContext';

export const CatalogoPublico = () => {
  const { storeId } = useParams(); // Obtenemos el ID del comercio desde la URL
  const { totalItems } = useCart();
  
  const [comercio, setComercio] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(['Todos']);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todos');
  const [errorTienda, setErrorTienda] = useState(false);

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

        // 1. Buscamos los datos generales del comercio en la colección 'comercios'
        const comercioDocRef = doc(db, 'comercios', storeId);
        const comercioSnap = await getDoc(comercioDocRef);

        if (comercioSnap.exists()) {
          setComercio(comercioSnap.data());
        } else {
          setErrorTienda(true);
          setLoading(false);
          return;
        }

        // 2. Obtenemos los productos de este comercio específico
        const prodSnapshot = await getDocs(collection(db, 'comercios', storeId, 'productos'));
        const listaProds = prodSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProductos(listaProds);

        // 3. Obtenemos las categorías de este comercio específico
        const catSnapshot = await getDocs(collection(db, 'comercios', storeId, 'categorias'));
        const listaCats = catSnapshot.docs.map(doc => doc.data().nombre).filter(Boolean);
        setCategorias(['Todos', ...listaCats]);

      } catch (error) {
        console.error("Error al cargar la tienda pública:", error);
        setErrorTienda(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTiendaPublica();
  }, [storeId]);

  const productosFiltrados = filtroCat === 'Todos' 
    ? productos 
    : productos.filter(p => p.categoria?.trim().toLowerCase() === filtroCat.trim().toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest animate-pulse">Cargando Catálogo Digital...</p>
      </div>
    );
  }

  if (errorTienda) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-3 shadow-sm">
          <i className='bx bx-store-alt text-3xl'></i>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-1">Comercio no encontrado</h2>
        <p className="text-xs text-slate-500 mb-6">El enlace al catálogo que intentaste abrir no existe o la tienda no está disponible.</p>
        <Link to="/" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20">
          Ir a Valhalla Store 🚀
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Navbar Superior Público para el Cliente */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs border-b-2 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img src="/StoreGladius.png" alt="Valhalla Store" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg md:text-xl font-black tracking-wider text-emerald-800 block leading-none">
                {comercio?.name || "Tienda Digital"}
              </span>
              <span className="text-[10px] md:text-xs font-bold tracking-widest text-slate-400 uppercase">Catálogo Oficial</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <i className='bx bx-cart text-emerald-700 text-xl'></i>
              <span className="text-xs font-black text-emerald-900">{totalItems} ítems</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido del Catálogo */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Navegación de Categorías */}
        <CategoryNav 
          categorias={categorias}
          categoriaSeleccionada={filtroCat}
          onSelectCategoria={setFiltroCat}
          vistaAdmin={false}
        />

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mt-6">
            <p className="text-slate-600 font-bold text-sm">No hay productos cargados en esta categoría actualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mt-6">
            {productosFiltrados.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* 🟢 CARRITO FLOTANTE CON EFECTO GLASS & BLUR */}
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      {/* 🟢 MODAL DE CHECKOUT Y DATOS DE ENVÍO PARA WHATSAPP */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />
    </div>
  );
};