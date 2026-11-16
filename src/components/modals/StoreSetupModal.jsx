import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { PlanSelectionModal } from './PlanSelectionModal';

// 🔴 TUS NÚMEROS Y CONFIGURACIONES DE ADMINISTRADOR
const ADMIN_WHATSAPP_NUMBER = '5491159781434';

export const StoreSetupModal = ({ onStoreRegistered }) => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const [paso, setPaso] = useState('form');
  const [isPendingActivation, setIsPendingActivation] = useState(false);
  
  const [businessData, setBusinessData] = useState({
    workshopName: '',
    ownerName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const storeDocRef = doc(db, 'comercios', currentUser.uid);
          const storeSnap = await getDoc(storeDocRef);
          
          if (storeSnap.exists()) {
            const data = storeSnap.data();
            
            // Guardamos el estado fresco en localStorage
            localStorage.setItem('valhalla_store_id', storeSnap.id);
            localStorage.setItem('valhalla_comercio', JSON.stringify(data));

            const isConfigured = Boolean(
              data.workshopConfigured && (data.name || data.workshopName)
            );
            
            // 🔴 COMPATIBILIDAD CON RAGNAROK: Acepta tanto 'status' como 'activo' en true
            const isActive = data.status === true || data.activo === true;
            
            if (isConfigured && isActive) {
              setIsPendingActivation(false);
              setIsOpen(false);
              if (onStoreRegistered) onStoreRegistered();
            } else {
              // Si está configurado pero aún no fue activado por Ragnarok
              setIsPendingActivation(true);
              setIsOpen(true);
            }
          } else {
            localStorage.removeItem('valhalla_store_id');
            localStorage.removeItem('valhalla_comercio');
            setBusinessData({
              workshopName: '',
              ownerName: currentUser.displayName || '',
              phone: '',
              address: '',
            });
            setIsPendingActivation(false);
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Error consultando comercio en Firestore:", error);
          setIsOpen(true);
        }
      } else {
        setUser(null);
        setIsPendingActivation(false);
        setIsOpen(true);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en onAuthStateChanged:", error);
      setLoading(false);
      setIsOpen(true);
    });

    return () => unsubscribe();
  }, [onStoreRegistered]);

  const handleLoginGoogle = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user && !businessData.ownerName) {
        setBusinessData(prev => ({ ...prev, ownerName: result.user.displayName || '' }));
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setAuthError(`Error al iniciar sesión: ${error.message}`);
    }
  };

  const handleSiguienteAPlanes = (e) => {
    e.preventDefault();
    if (!businessData.workshopName.trim() || !businessData.ownerName.trim() || !businessData.phone.trim()) return;
    setPaso('planes');
  };

  const seleccionarPlanYEnviarWhatsApp = async (planElegido) => {
    try {
      const storeId = user.uid;
      
      const planName = planElegido.nombre || planElegido.name || planElegido.id || 'Plan';
      const planPrice = Number(planElegido.precio || planElegido.price || 0);
      const planMaintenance = Number(planElegido.mantenimiento_mensual || 0);

      const rawNumber = businessData.phone.replace(/\D/g, '');
      const formattedWhatsapp = rawNumber.startsWith('549') ? `+${rawNumber}` : rawNumber.startsWith('54') ? `+549${rawNumber.slice(2)}` : `+549${rawNumber}`;

      const comercioData = {
        ownerUid: user.uid,
        name: businessData.workshopName.trim(),
        ownerName: businessData.ownerName.trim(),
        ownerEmail: user.email || '',
        phone: formattedWhatsapp,
        address: businessData.address.trim(),
        planId: planElegido.id,
        planName: planName,
        planPrice: planPrice,
        planMaintenance: planMaintenance,
        workshopConfigured: true,
        status: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'comercios', storeId), comercioData, { merge: true });

      localStorage.setItem('valhalla_store_id', storeId);
      localStorage.setItem('valhalla_comercio', JSON.stringify(comercioData));

      const whatsappMessage = [
        '🚨 *REGISTRO PENDIENTE DE PAGO - VALHALLA STORE*',
        '',
        `🏪 *Comercio:* ${comercioData.name}`,
        `👤 *Titular:* ${comercioData.ownerName}`,
        `📱 *WhatsApp Local:* ${comercioData.phone}`,
        `💎 *Plan Elegido:* ${planName}`,
        `💵 *Pago Único de Alta:* $${planPrice.toLocaleString('es-AR')}`,
        `🔄 *Mantenimiento Mensual:* $${planMaintenance.toLocaleString('es-AR')}`,
        `🆔 *ID Comercio:* ${user.uid}`,
        '',
        'El comercio ha completado su registro y aguarda validación para activar su cuenta.',
      ].join('\n');

      const urlWhatsApp = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');

      setIsPendingActivation(true);
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-800">
        
        {!user ? (
          <div className="text-center py-6">
            <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Plataforma SaaS Multi-Comercio 🚀
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-4 text-slate-900">
              Acceso Exclusivo Comerciantes
            </h2>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              Inicia sesión con tu cuenta de Google para registrar tu tienda digital.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {authError}
              </div>
            )}

            <button
              onClick={handleLoginGoogle}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-black py-3.5 rounded-2xl flex items-center justify-center gap-3 shadow-sm transition-all active:scale-95 text-sm cursor-pointer"
            >
              <i className='bx bxl-google text-red-600 text-xl'></i> Continuar con Google
            </button>
          </div>
        ) : isPendingActivation ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
              <i className='bx bx-time-five text-3xl animate-spin'></i>
            </div>
            <span className="text-[10px] font-black tracking-widest text-amber-800 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Activación Pendiente ⏳
            </span>
            <h2 className="text-xl font-black tracking-tight mt-3 text-slate-900">
              Esperando Confirmación de Pago
            </h2>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
              Tu tienda ya fue registrada y elegiste tu plan. Una vez que acredites el pago con el administrador, tu cuenta será habilitada para gestionar categorías y productos.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1 mb-6">
              <p className="text-slate-500">Cuenta: <span className="text-slate-800 font-bold">{user.email}</span></p>
              <p className="text-slate-500">Estado: <span className="text-amber-700 font-bold">Pendiente de habilitación</span></p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-100 hover:bg-slate-200 text-emerald-800 font-black py-3 rounded-2xl text-xs uppercase tracking-wider border border-slate-200 cursor-pointer transition-all"
            >
              Verificar si ya fui habilitado 🔄
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Paso 1 de 2: Datos de tu Tienda 🚀
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-3 text-slate-900">
                Registra tu Comercio
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Autenticado como: <span className="text-emerald-700 font-bold">{user.email}</span>
              </p>
            </div>

            <form onSubmit={handleSiguienteAPlanes} className="space-y-3.5 text-xs font-bold text-slate-600">
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Nombre del Comercio <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessData.workshopName}
                  onChange={(e) => setBusinessData({...businessData, workshopName: e.target.value})}
                  placeholder="Ej. Valhalla Store"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Nombre y Apellido del Titular <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessData.ownerName}
                  onChange={(e) => setBusinessData({...businessData, ownerName: e.target.value})}
                  placeholder="Ej. Fabián González"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  WhatsApp del Comercio <span className="text-emerald-600">*</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <span className="pl-4 pr-2 text-sm text-emerald-700 font-mono select-none">+549</span>
                  <input
                    type="tel"
                    required
                    value={businessData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setBusinessData({...businessData, phone: val});
                    }}
                    placeholder="1159781434"
                    className="w-full bg-transparent border-none px-2 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Ingresá tu número sin el +549 (ej: 1159781434)</span>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-[10px] text-slate-500">
                  Dirección del Local <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={businessData.address}
                  onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
                  placeholder="Ej. Av. Calchaquí 1234, Quilmes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-normal placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl uppercase tracking-wider text-xs md:text-sm shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 mt-4 cursor-pointer"
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