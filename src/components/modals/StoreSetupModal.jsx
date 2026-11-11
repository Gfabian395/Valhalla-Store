import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { PlanSelectionModal } from './PlanSelectionModal';

export const StoreSetupModal = ({ onStoreRegistered }) => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [estadoComercio, setEstadoComercio] = useState('');
  
  const [paso, setPaso] = useState('form');
  
  const [comercio, setComercio] = useState({
    nombreComercio: '',
    direccionComercio: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    tiktok: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // Lectura directa del documento usando el UID del usuario como ID en la colección 'comercios'
          const storeDocRef = doc(db, 'comercios', currentUser.uid);
          const storeSnap = await getDoc(storeDocRef);
          
          if (storeSnap.exists()) {
            const data = storeSnap.data();
            
            localStorage.setItem('valhalla_store_id', storeSnap.id);
            localStorage.setItem('valhalla_comercio', JSON.stringify(data));
            
            if (data.activo === true) {
              setIsOpen(false);
            } else {
              setEstadoComercio('pendiente_pago');
              setIsOpen(true);
            }
          } else {
            localStorage.removeItem('valhalla_store_id');
            localStorage.removeItem('valhalla_comercio');
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Error consultando comercio en Firestore:", error);
          setIsOpen(true);
        }
      } else {
        setUser(null);
        setIsOpen(true);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en onAuthStateChanged:", error);
      setLoading(false);
      setIsOpen(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginGoogle = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setAuthError(`Error al iniciar sesión: ${error.message}`);
    }
  };

  const handleSiguienteAPlanes = (e) => {
    e.preventDefault();
    if (!comercio.nombreComercio.trim()) return;
    setPaso('planes');
  };

  const seleccionarPlanYEnviarWhatsApp = async (planElegido) => {
    try {
      const storeId = user.uid;
      
      const rawNumber = comercio.whatsapp.replace(/\D/g, '');
      const formattedWhatsapp = rawNumber.startsWith('549') ? `+${rawNumber}` : rawNumber.startsWith('54') ? `+549${rawNumber.slice(2)}` : `+549${rawNumber}`;

      const comercioData = {
        ...comercio,
        whatsapp: formattedWhatsapp,
        plan: planElegido.id,
        ownerUid: user.uid,
        ownerEmail: user.email,
        estado: 'pendiente_pago', 
        activo: false,
        createdAt: new Date().toISOString()
      };

      // Guardamos el documento en la colección 'comercios' usando el UID como ID
      await setDoc(doc(db, 'comercios', storeId), comercioData);

      localStorage.setItem('valhalla_store_id', storeId);
      localStorage.setItem('valhalla_comercio', JSON.stringify(comercioData));

      const tuNumeroWhatsApp = "5491159781434"; 

      let mensaje = `🚨 *NUEVO REGISTRO - VALHALLA STORE*\n\n`;
      mensaje += `🏪 *Local:* ${comercio.nombreComercio}\n`;
      mensaje += `📦 *Plan Solicitado:* ${planElegido.id}\n`;
      mensaje += `📍 *Dirección:* ${comercio.direccionComercio}\n`;
      mensaje += `📱 *WhatsApp:* ${formattedWhatsapp}\n`;
      mensaje += `🔑 *UID:* ${user.uid}\n\n`;
      mensaje += `Solicito activación de cuenta.`;

      const urlWhatsApp = `https://wa.me/${tuNumeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
      window.open(urlWhatsApp, '_blank');

      setEstadoComercio('pendiente_pago');
      setIsOpen(true);
    } catch (error) {
      console.error("Error al registrar el comercio en Firestore:", error);
      alert(`Hubo un error al registrar el comercio: ${error.message}`);
    }
  };

  if (loading) return null;
  if (!isOpen) return null;

  if (paso === 'planes') {
    return (
      <PlanSelectionModal 
        isOpen={true} 
        onSelectPlan={seleccionarPlanYEnviarWhatsApp} 
        onBack={() => setPaso('form')} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-slate-900 border-2 border-yellow-400/50 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white">
        
        {!user ? (
          <div className="text-center py-6">
            <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
              Plataforma SaaS Multi-Comercio 🚀
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-4 text-white">
              Acceso Exclusivo Comerciantes
            </h2>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Inicia sesión con tu cuenta de Google para registrar tu tienda digital.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs">
                {authError}
              </div>
            )}

            <button
              onClick={handleLoginGoogle}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black py-3.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-95 text-sm cursor-pointer"
            >
              <i className='bx bxl-google text-red-600 text-xl'></i> Continuar con Google
            </button>
          </div>
        ) : estadoComercio === 'pendiente_pago' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-inner">
              <i className='bx bx-time-five text-3xl animate-spin'></i>
            </div>
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Activación Pendiente ⏳
            </span>
            <h2 className="text-xl font-black tracking-tight mt-3 text-white">
              Esperando Confirmación de Pago
            </h2>
            <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
              Tu tienda ya fue registrada y elegiste tu plan. Una vez que acredites el pago con el administrador, tu cuenta será habilitada para gestionar categorías y productos.
            </p>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-left text-xs space-y-1 mb-6">
              <p className="text-slate-400">Cuenta: <span className="text-white font-bold">{user.email}</span></p>
              <p className="text-slate-400">Estado: <span className="text-amber-400 font-bold">Pendiente de habilitación</span></p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-yellow-400 font-black py-3 rounded-2xl text-xs uppercase tracking-wider border border-slate-700 cursor-pointer transition-all"
            >
              Verificar si ya fui habilitado 🔄
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                Paso 1 de 2: Datos de tu Tienda 🚀
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-3 text-white">
                Registra tu Comercio
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Autenticado como: <span className="text-yellow-400 font-bold">{user.email}</span>
              </p>
            </div>

            <form onSubmit={handleSiguienteAPlanes} className="space-y-3.5 text-xs font-bold text-slate-300">
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-400">Nombre de tu Comercio</label>
                <input
                  type="text"
                  required
                  value={comercio.nombreComercio}
                  onChange={(e) => setComercio({...comercio, nombreComercio: e.target.value})}
                  placeholder="Distribuidora Diego"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-normal placeholder-slate-500 focus:border-yellow-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-400">Dirección del Local</label>
                <input
                  type="text"
                  required
                  value={comercio.direccionComercio}
                  onChange={(e) => setComercio({...comercio, direccionComercio: e.target.value})}
                  placeholder="Av. Calchaquí 4500"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-normal placeholder-slate-500 focus:border-yellow-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-400">WhatsApp para Pedidos</label>
                <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden focus-within:border-yellow-400 transition-all">
                  <span className="pl-4 pr-2 text-sm text-yellow-400 font-mono select-none">+549</span>
                  <input
                    type="text"
                    required
                    value={comercio.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setComercio({...comercio, whatsapp: val});
                    }}
                    placeholder="1159781434"
                    className="w-full bg-transparent border-none px-2 py-3 text-sm text-white font-normal placeholder-slate-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Ingresá tu número sin el +549 (ej: 1159781434)</span>
              </div>

              <button 
                type="submit" 
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black py-3.5 rounded-2xl uppercase tracking-wider text-xs md:text-sm shadow-lg transition-transform active:scale-95 mt-4 cursor-pointer"
              >
                Continuar a Selección de Planes 🚀
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};