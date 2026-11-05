import React from 'react';

export const PlanSelectionModal = ({ isOpen, onSelectPlan, onBack }) => {
  console.log("[PlanSelectionModal] Renderizando componente. isOpen:", isOpen);
  
  if (!isOpen) return null;

  const planesDisponibles = [
    { id: 'basico', nombre: 'Plan Básico', precio: '$20.000 /mes', desc: '5 Categorías • 10 Productos por categoría' },
    { id: 'pro', nombre: 'Plan Pro', precio: '$30.000 /mes', desc: '10 Categorías • 15 Productos por categoría' },
    { id: 'experto', nombre: 'Plan Experto', precio: '$50.000 /mes', desc: '30 Categorías • 50 Productos por categoría' },
    { id: 'empresa', nombre: 'Plan Empresa (Ilimitado)', precio: '$100.000 /mes', desc: 'Categorías y Productos Ilimitados' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-slate-900 border-2 border-yellow-400/50 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white">
        
        <div className="mb-6 text-center">
          <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
            Paso 2 de 2: Elegí tu Plan 🚀
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-3 text-white">
            Selecciona una Suscripción
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Al elegir tu plan, se abrirá tu WhatsApp para coordinar el alta de forma directa con Valhalla Store.
          </p>
        </div>

        <div className="space-y-3">
          {planesDisponibles.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => {
                console.log("[PlanSelectionModal] Clic en plan:", plan.id);
                onSelectPlan(plan);
              }}
              className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-yellow-400 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
            >
              <div>
                <h3 className="text-sm font-black text-yellow-400 group-hover:text-white transition-colors">
                  {plan.nombre} - <span className="text-white">{plan.precio}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{plan.desc}</p>
              </div>
              <span className="bg-green-600 group-hover:bg-green-500 text-white p-2.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow">
                <i className='bx bxl-whatsapp text-lg'></i> Elegir
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 text-xs text-slate-400 hover:text-white underline block mx-auto cursor-pointer"
        >
          ← Volver a editar datos del comercio
        </button>

      </div>
    </div>
  );
};