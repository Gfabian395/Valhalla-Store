import React, { useState, useEffect } from 'react';
import { FlyerHeader } from '../components/store/FlyerHeader';
import { ProductCard } from '../components/store/ProductCard';
import { CategoryNav } from '../components/store/CategoryNav';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export const Home = ({ vistaAdmin }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(['Todos']);
  const [loading, setLoading] = useState(true);
  const [filtroCat, setFiltroCat] = useState('Todos');

  const [modalProdOpen, setModalProdOpen] = useState(false);
  const [modalCatOpen, setModalCatOpen] = useState(false);
  
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '',
    precioAnterior: '',
    precioOferta: '',
    imagen: '',
    categoria: '',
    etiqueta: 'OFERTA'
  });
  const [nuevaCat, setNuevaCat] = useState('');

  const storeId = localStorage.getItem('valhalla_store_id') || '';
  const comercioGuardado = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};

  const fetchDataFromFirebase = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const prodSnapshot = await getDocs(collection(db, 'comercios', storeId, 'productos'));
      const listaProds = prodSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(listaProds);

      const catSnapshot = await getDocs(collection(db, 'comercios', storeId, 'categorias'));
      const listaCats = catSnapshot.docs.map(doc => doc.data().nombre).filter(Boolean);
      
      setCategorias(['Todos', ...listaCats]);

      if (filtroCat !== 'Todos' && !listaCats.includes(filtroCat)) {
        setFiltroCat('Todos');
      }

    } catch (error) {
      console.error("Aviso al sincronizar con Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromFirebase();
  }, [storeId]);

  const handleAbrirModalProducto = () => {
    const categoriaSugerida = filtroCat !== 'Todos' ? filtroCat : (categorias[1] || '');
    setNuevoProd({
      nombre: '',
      precioAnterior: '',
      precioOferta: '',
      imagen: '',
      categoria: categoriaSugerida,
      etiqueta: 'OFERTA'
    });
    setModalProdOpen(true);
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevoProd(prev => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      const categoriaDestino = nuevoProd.categoria || (filtroCat !== 'Todos' ? filtroCat : categorias[1] || 'General');
      
      await addDoc(collection(db, 'comercios', storeId, 'productos'), {
        ...nuevoProd,
        categoria: categoriaDestino.trim(),
        precioAnterior: Number(nuevoProd.precioAnterior),
        precioOferta: Number(nuevoProd.precioOferta)
      });
      
      setModalProdOpen(false);
      setNuevoProd({ nombre: '', precioAnterior: '', precioOferta: '', imagen: '', categoria: '', etiqueta: 'OFERTA' });
      fetchDataFromFirebase();
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCat.trim() || !storeId) return;

    try {
      await addDoc(collection(db, 'comercios', storeId, 'categorias'), { nombre: nuevaCat.trim() });
      setNuevaCat('');
      setModalCatOpen(false);
      fetchDataFromFirebase();
    } catch (error) {
      console.error("Error al guardar categoría en Firebase:", error);
    }
  };

  const productosFiltrados = filtroCat === 'Todos' 
    ? productos 
    : productos.filter(p => p.categoria?.trim().toLowerCase() === filtroCat.trim().toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <FlyerHeader />

      {/* Pasamos vistaAdmin al componente de navegación de categorías */}
      <CategoryNav 
        categorias={categorias}
        categoriaSeleccionada={filtroCat}
        onSelectCategoria={setFiltroCat}
        onAddCategory={() => setModalCatOpen(true)}
        vistaAdmin={vistaAdmin}
      />

      {vistaAdmin && (
        <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl p-5 mb-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div>
            <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest block bg-yellow-400/10 px-2 py-0.5 rounded-full w-fit mb-1">
              Panel Exclusivo Multi-Comercio ({comercioGuardado.nombreComercio || 'Mi Tienda'})
            </span>
            <h2 className="text-base md:text-lg font-black">Gestión de Catálogo ({filtroCat})</h2>
          </div>
          <button
            onClick={handleAbrirModalProducto}
            disabled={categorias.length === 1}
            className={`w-full md:w-auto font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
              categorias.length === 1 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 active:scale-95'
            }`}
          >
            <i className='bx bx-plus text-lg'></i> Agregar Producto
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Sincronizando con tu Base de Datos Aislada...</p>
        </div>
      ) : categorias.length === 1 && vistaAdmin ? (
        <div className="text-center py-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-amber-100">
            <i className='bx bx-folder-plus text-2xl'></i>
          </div>
          <p className="text-slate-800 dark:text-white font-black text-base">Aún no hay categorías creadas para este comercio</p>
          <p className="text-xs text-slate-500 mt-1 mb-5">Crea tu primera categoría para organizar tu inventario privado.</p>
          <button
            onClick={() => setModalCatOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            + Crear Primera Categoría
          </button>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <p className="text-slate-700 dark:text-slate-200 font-bold text-sm">No hay productos cargados en la categoría "{filtroCat}".</p>
          {vistaAdmin && (
            <button
              onClick={handleAbrirModalProducto}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow cursor-pointer"
            >
              + Cargar el primer producto aquí
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {productosFiltrados.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Modal Nueva Categoría */}
      {modalCatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/20 relative">
            <button 
              onClick={() => setModalCatOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                SaaS Config
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-2">Nueva Categoría</h3>
            </div>
            <form onSubmit={handleCrearCategoria} className="space-y-4">
              <input
                type="text"
                required
                value={nuevaCat}
                onChange={(e) => setNuevaCat(e.target.value)}
                placeholder="Ej: Bebidas, Almacén..."
                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
              />
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer">
                Guardar Categoría 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {modalProdOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-white/20 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalProdOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-black tracking-widest text-red-600 uppercase bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Inventario SaaS
              </span>
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
                Nuevo Producto
              </h3>
            </div>
            <form onSubmit={handleCrearProducto} className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Categoría</label>
                <select
                  value={nuevoProd.categoria}
                  onChange={(e) => setNuevoProd({...nuevoProd, categoria: e.target.value})}
                  required
                  className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                >
                  <option value="" disabled>Seleccioná una categoría</option>
                  {categorias.filter(c => c !== 'Todos').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={nuevoProd.nombre}
                  onChange={(e) => setNuevoProd({...nuevoProd, nombre: e.target.value})}
                  className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                  placeholder="Ej: Gaseosa Cola"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Precio Anterior ($)</label>
                  <input
                    type="number"
                    value={nuevoProd.precioAnterior}
                    onChange={(e) => setNuevoProd({...nuevoProd, precioAnterior: e.target.value})}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                    placeholder="3500"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Precio de Oferta ($)</label>
                  <input
                    type="number"
                    required
                    value={nuevoProd.precioOferta}
                    onChange={(e) => setNuevoProd({...nuevoProd, precioOferta: e.target.value})}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                    placeholder="2899"
                  />
                </div>
              </div>
              
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px]">Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleImagenChange}
                  className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm text-slate-800 font-normal file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer outline-none transition-all"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl uppercase tracking-wider text-xs md:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer mt-2">
                Publicar en Mi Tienda 🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};