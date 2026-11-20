import React, { useState, useEffect } from 'react';
import { obtenerTemaComercio } from '../../utils/temasComercio';

const leerColorTema = () => {
  try {
    const comercioLocal = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioLocal.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const CategoryNav = ({
  categorias,
  categoriaSeleccionada,
  onSelectCategoria,
  onAddCategory,
  onDeleteCategory,
  vistaAdmin,
  colorTema,
  tema: temaProp
}) => {
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

  const listaNormalizada = (categorias || []).map((cat) => {
    if (typeof cat === 'string') {
      return {
        id: cat === 'Todos' ? '__todos__' : '',
        nombre: cat,
        esTodos: cat === 'Todos'
      };
    }
    const nombre = cat?.nombre || '';
    return {
      id: cat?.id || '',
      nombre,
      esTodos: nombre === 'Todos'
    };
  });

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-4 mb-6 scrollbar-none max-w-full">
      {listaNormalizada.map((cat) => {
        const activa = categoriaSeleccionada === cat.nombre;
        const puedeEliminar =
          vistaAdmin &&
          !cat.esTodos &&
          Boolean(cat.id) &&
          typeof onDeleteCategory === 'function';

        if (puedeEliminar) {
          return (
            <div
              key={cat.id || cat.nombre}
              className={`inline-flex items-center rounded-2xl border-2 transition-all shrink-0 overflow-hidden shadow-xs ${
                activa
                  ? `${tema.botonPrimario} ${tema.bordeDestacado} shadow-md`
                  : `bg-white hover:bg-slate-50 text-slate-700 border-slate-200 ${tema.bordeHover}`
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectCategoria(cat.nombre)}
                className="pl-3.5 pr-2 py-2 text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer"
              >
                {cat.nombre}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(cat);
                }}
                title={`Eliminar categoría ${cat.nombre}`}
                aria-label={`Eliminar categoría ${cat.nombre}`}
                className={`pr-2.5 pl-1.5 py-2 text-xs font-black leading-none flex items-center justify-center transition-colors cursor-pointer border-l ${
                  activa
                    ? 'border-white/25 text-white/90 hover:text-white hover:bg-black/15'
                    : 'border-slate-200/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                ×
              </button>
            </div>
          );
        }

        return (
          <button
            type="button"
            key={cat.id || cat.nombre}
            onClick={() => onSelectCategoria(cat.nombre)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-xs cursor-pointer shrink-0 ${
              activa
                ? `${tema.botonPrimario} border-2 ${tema.bordeDestacado} shadow-md`
                : `bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 ${tema.bordeHover}`
            }`}
          >
            {cat.nombre}
          </button>
        );
      })}

      {/* El botón para crear nueva categoría solo se renderiza si vistaAdmin es verdadero */}
      {vistaAdmin && typeof onAddCategory === 'function' && (
        <button
          type="button"
          onClick={onAddCategory}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer shrink-0 border-2 border-transparent ${tema.botonPrimario}`}
          title="Crear Nueva Categoría"
        >
          <i className="bx bx-plus text-base font-bold leading-none"></i>
          <span>Nueva Categoría</span>
        </button>
      )}
    </div>
  );
};