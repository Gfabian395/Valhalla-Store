import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { obtenerTemaComercio } from '../../utils/temasComercio';

const leerColorTema = () => {
  try {
    const comercioLocal = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioLocal.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const PlanSelectionModal = ({ isOpen, onSelectPlan, onBack, colorTema }) => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temaIdActual, setTemaIdActual] = useState(() => colorTema || leerColorTema());

  useEffect(() => {
    if (colorTema) {
      setTemaIdActual(colorTema);
    }
  }, [colorTema]);

  useEffect(() => {
    const sincronizarTema = (evento) => {
      setTemaIdActual(evento?.detail?.colorTema || colorTema || leerColorTema());
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarTema);
    window.addEventListener('valhalla:comercio-actualizado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarTema);
      window.removeEventListener('valhalla:comercio-actualizado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
    };
  }, [colorTema]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlanes = async () => {
      try {
        setLoading(true);
        // Consultamos la colección store_planes en Firestore
        const querySnapshot = await getDocs(collection(db, 'store_planes'));
        const planesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setPlanes(planesList);
      } catch (error) {
        console.error('[PlanSelectionModal] Error al obtener los planes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanes();
  }, [isOpen]);

  if (!isOpen) return null;

  const tema = obtenerTemaComercio(temaIdActual);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-800">
        <div className="mb-6 text-center">
          <span
            className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${tema.badgeSuave}`}
          >
            Paso 2 de 2: Elegí tu Plan 🚀
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-3 text-slate-900">
            Seleccioná una Suscripción
          </h2>
          <p className="text-xs text-slate-500 mt-1">
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
                onClick={() => onSelectPlan(plan)}
                className={`bg-slate-50 hover:bg-slate-50/80 border-2 border-slate-200 ${tema.bordeHover} p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 group shadow-sm`}
              >
                <div className="min-w-0">
                  <h3
                    className={`text-sm font-black transition-colors ${tema.textoAcento} ${tema.textoEnlaceHover}`}
                  >
                    {plan.nombre || plan.id}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                    {plan.precio !== undefined && (
                      <span className="text-slate-700 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                        Pago único: ${Number(plan.precio).toLocaleString('es-AR')}
                      </span>
                    )}
                    {plan.mantenimiento_mensual !== undefined && (
                      <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Mantenimiento: ${Number(plan.mantenimiento_mensual).toLocaleString('es-AR')}{' '}
                        /mes
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5 flex flex-wrap gap-x-2">
                    <span>
                      -{' '}
                      {plan.maximo_categorias !== undefined
                        ? `${plan.maximo_categorias} Categorías`
                        : 'Categorías ilimitadas'}
                    </span>
                    <span>
                      -{' '}
                      {plan.maximo_productos_por_categoria !== undefined
                        ? `${plan.maximo_productos_por_categoria} Prod. por categoría`
                        : 'Productos ilimitados'}
                    </span>
                  </p>
                </div>

                <span
                  className={`p-2.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1 shadow-md transition-colors ${tema.botonPrimario}`}
                >
                  <i className="bx bxl-whatsapp text-lg"></i> Elegir
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-5 text-xs text-slate-500 hover:text-slate-800 underline block mx-auto cursor-pointer font-medium"
        >
          ← Volver a editar datos del comercio
        </button>
      </div>
    </div>
  );
};