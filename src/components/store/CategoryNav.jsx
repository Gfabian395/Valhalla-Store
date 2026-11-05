import React from 'react';

export const CategoryNav = ({ categorias, categoriaSeleccionada, onSelectCategoria, onAddCategory, vistaAdmin }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
      {categorias.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategoria(cat)}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${
            categoriaSeleccionada === cat
              ? 'bg-slate-900 text-yellow-400 border-2 border-yellow-400 shadow-md'
              : 'bg-white/80 backdrop-blur-md text-slate-700 border-2 border-slate-200 hover:border-slate-400'
          }`}
        >
          {cat}
        </button>
      ))}

      {/* El botón para crear nueva categoría solo se renderiza si vistaAdmin es verdadero */}
      {vistaAdmin && (
        <button
          onClick={onAddCategory}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1 shadow transition-transform active:scale-95 cursor-pointer"
          title="Crear Nueva Categoría"
        >
          <i className='bx bx-plus text-base font-bold'></i> Nueva Categoría
        </button>
      )}
    </div>
  );
};