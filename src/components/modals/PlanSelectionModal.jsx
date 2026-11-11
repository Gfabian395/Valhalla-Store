import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const PlanSelectionModal = ({ isOpen, onSelectPlan, onBack }) => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("[PlanSelectionModal] Renderizando componente. isOpen:", isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlanes = async () => {
      try {
        setLoading(true);
        // Consultamos la colección store_planes en Firestore
        const querySnapshot = await getDocs(collection(db, "store_planes"));
        const planesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log("[PlanSelectionModal] Planes obtenidos de Firestore:", planesList);
        setPlanes(planesList);
      } catch (error) {
        console.error("[PlanSelectionModal] Error al obtener los planes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanes();
  }, [isOpen]);

  if (!isOpen) return null;

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

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Cargando planes desde la base de datos...
          </div>
        ) : planes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No se encontraron planes configurados en la base de datos.
          </div>
        ) : (
          <div className="space-y-3">
            {planes.map((plan) => (
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
                    {plan.nombre || plan.id}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                    {plan.precio !== undefined && (
                      <span className="text-white font-bold bg-slate-700/70 px-2 py-0.5 rounded-md">
                        Pago único: ${Number(plan.precio).toLocaleString()}
                      </span>
                    )}
                    {plan.mantenimiento_mensual !== undefined && (
                      <span className="text-yellow-300 font-bold bg-slate-700/70 px-2 py-0.5 rounded-md">
                        Mantenimiento: ${Number(plan.mantenimiento_mensual).toLocaleString()} /mes
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 flex flex-wrap gap-x-2">
                    <span>• {plan.maximo_categorias !== undefined ? `${plan.maximo_categorias} Categorías` : 'Categorías ilimitadas'}</span>
                    <span>• {plan.maximo_productos_por_categoria !== undefined ? `${plan.maximo_productos_por_categoria} Prod. por categoría` : 'Productos ilimitados'}</span>
                  </p>
                </div>
                
                <span className="bg-green-600 group-hover:bg-green-500 text-white p-2.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow">
                  <i className='bx bxl-whatsapp text-lg'></i> Elegir
                </span>
              </div>
            ))}
          </div>
        )}

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