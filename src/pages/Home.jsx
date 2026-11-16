import React, { useState, useEffect } from 'react';
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
    etiqueta: 'OFERTA',
    usaTalles: false,
    tallesInput: 'S, M, L, XL, XXL' // Input de texto editable por el usuario
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
      etiqueta: 'OFERTA',
      usaTalles: false,
      tallesInput: 'S, M, L, XL, XXL'
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
      
      // Convertimos el texto escrito a mano ("S, M, L") en un array limpio ['S', 'M', 'L']
      const arrayTalles = nuevoProd.usaTalles 
        ? nuevoProd.tallesInput.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      await addDoc(collection(db, 'comercios', storeId, 'productos'), {
        nombre: nuevoProd.nombre.trim(),
        categoria: categoriaDestino.trim(),
        precioAnterior: Number(nuevoProd.precioAnterior) || 0,
        precioOferta: Number(nuevoProd.precioOferta) || 0,
        imagen: nuevoProd.imagen,
        etiqueta: nuevoProd.etiqueta,
        usaTalles: nuevoProd.usaTalles,
        talles: arrayTalles
      });
      
      setModalProdOpen(false);
      setNuevoProd({ 
        nombre: '', 
        precioAnterior: '', 
        precioOferta: '', 
        imagen: '', 
        categoria: '', 
        etiqueta: 'OFERTA',
        usaTalles: false,
        tallesInput: 'S, M, L, XL, XXL'
      });
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

  const nombreComercioMostrar = comercioGuardado.name || comercioGuardado.nombreComercio || 'Mi Tienda';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Pasamos vistaAdmin al componente de navegación de categorías */}
      <CategoryNav 
        categorias={categorias}
        categoriaSeleccionada={filtroCat}
        onSelectCategoria={setFiltroCat}
        onAddCategory={() => setModalCatOpen(true)}
        vistaAdmin={vistaAdmin}
      />

      {vistaAdmin && (
        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-5 mb-6 shadow-xl shadow-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-800">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            {/* Símbolo del Espartano adaptado a la paleta clara */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
              <i className='bx bx-shield-alt-2 text-emerald-700 text-2xl font-black'></i>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 font-black uppercase tracking-widest block bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit mb-1 border border-emerald-200">
                Panel Exclusivo Multi-Comercio ({nombreComercioMostrar})
              </span>
              <h2 className="text-base md:text-lg font-black text-slate-900">Gestión de Catálogo ({filtroCat})</h2>
            </div>
          </div>
          <button
            onClick={handleAbrirModalProducto}
            disabled={categorias.length === 1}
            className={`w-full md:w-auto font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
              categorias.length === 1 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
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
        <div className="text-center py-16 bg-white backdrop-blur-md rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-100">
            <i className='bx bx-folder-plus text-2xl'></i>
          </div>
          <p className="text-slate-900 font-black text-base">Aún no hay categorías creadas para este comercio</p>
          <p className="text-xs text-slate-500 mt-1 mb-5">Crea tu primera categoría para organizar tu inventario privado.</p>
          <button
            onClick={() => setModalCatOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 cursor-pointer"
          >
            + Crear Primera Categoría
          </button>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white backdrop-blur-md rounded-3xl border border-slate-200 p-6 shadow-sm">
          <p className="text-slate-700 font-bold text-sm">No hay productos cargados en la categoría "{filtroCat}".</p>
          {vistaAdmin && (
            <button
              onClick={handleAbrirModalProducto}
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow shadow-emerald-600/20 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setModalCatOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                SaaS Config
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-2">Nueva Categoría</h3>
            </div>
            <form onSubmit={handleCrearCategoria} className="space-y-4">
              <input
                type="text"
                required
                value={nuevaCat}
                onChange={(e) => setNuevaCat(e.target.value)}
                placeholder="Ej: Bebidas, Almacén..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 cursor-pointer">
                Guardar Categoría 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {modalProdOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalProdOpen(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Inventario SaaS
              </span>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-2">
                Nuevo Producto
              </h3>
            </div>
            <form onSubmit={handleCrearProducto} className="space-y-3.5 text-xs font-bold text-slate-600">
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">Categoría</label>
                <select
                  value={nuevoProd.categoria}
                  onChange={(e) => setNuevoProd({...nuevoProd, categoria: e.target.value})}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                >
                  <option value="" disabled>Seleccioná una categoría</option>
                  {categorias.filter(c => c !== 'Todos').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={nuevoProd.nombre}
                  onChange={(e) => setNuevoProd({...nuevoProd, nombre: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  placeholder="Ej: Zapatillas Urbanas / Remera"
                />
              </div>

              {/* 🟢 CHECK DE HABILITACIÓN DE TALLES */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={nuevoProd.usaTalles}
                    onChange={(e) => setNuevoProd({...nuevoProd, usaTalles: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-emerald-900">
                    ¿Este producto vende con talles? (Remeras, Zapatillas, etc.)
                  </span>
                </label>

                {/* Si está marcado, mostramos el input para escribir los talles a mano */}
                {nuevoProd.usaTalles && (
                  <div className="pt-1">
                    <label className="block text-[10px] uppercase font-bold text-emerald-800 mb-1">
                      Escribí los talles separados por comas:
                    </label>
                    <input
                      type="text"
                      required={nuevoProd.usaTalles}
                      value={nuevoProd.tallesInput}
                      onChange={(e) => setNuevoProd({...nuevoProd, tallesInput: e.target.value})}
                      placeholder="Ej: S, M, L, XL o 39, 40, 41"
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">Precio Anterior ($)</label>
                  <input
                    type="number"
                    value={nuevoProd.precioAnterior}
                    onChange={(e) => setNuevoProd({...nuevoProd, precioAnterior: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    placeholder="3500"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">Precio de Oferta ($)</label>
                  <input
                    type="number"
                    required
                    value={nuevoProd.precioOferta}
                    onChange={(e) => setNuevoProd({...nuevoProd, precioOferta: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    placeholder="2899"
                  />
                </div>
              </div>
              
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleImagenChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 font-normal file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer outline-none transition-all"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl uppercase tracking-wider text-xs md:text-sm shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 cursor-pointer mt-2">
                Publicar en Mi Tienda 🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};