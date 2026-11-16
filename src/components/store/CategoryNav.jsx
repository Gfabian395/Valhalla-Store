import React from 'react';

export const CategoryNav = ({ categorias, categoriaSeleccionada, onSelectCategoria, onAddCategory, vistaAdmin }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
      {categorias.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategoria(cat)}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-xs cursor-pointer ${
            categoriaSeleccionada === cat
              ? 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-md shadow-emerald-600/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-emerald-500'
          }`}
        >
          {cat}
        </button>
      ))}

      {/* El botón para crear nueva categoría solo se renderiza si vistaAdmin es verdadero */}
      {vistaAdmin && (
        <button
          onClick={onAddCategory}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-transform active:scale-95 cursor-pointer"
          title="Crear Nueva Categoría"
        >
          <i className='bx bx-plus text-base font-bold'></i> Nueva Categoría
        </button>
      )}
    </div>
  );
};