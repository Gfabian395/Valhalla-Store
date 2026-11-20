import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CartDrawer } from '../components/store/CartDrawer';
import { CheckoutModal } from '../components/modals/CheckoutModal';
import { StoreSetupModal } from '../components/modals/StoreSetupModal';
import { obtenerTemaComercio } from '../utils/temasComercio';

const leerColorTemaGuardado = () => {
  try {
    const comercioGuardado = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioGuardado.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

export const MainLayout = ({
  children,
  vistaAdmin,
  setVistaAdmin,
  onLogout,
  onStoreRegistered,
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [colorTema, setColorTema] = useState(() => leerColorTemaGuardado());

  useEffect(() => {
    const sincronizarTema = (evento) => {
      const nuevoTema = evento?.detail?.colorTema || leerColorTemaGuardado();
      setColorTema(nuevoTema);
    };

    window.addEventListener('valhalla:tema-cambiado', sincronizarTema);
    window.addEventListener('valhalla:comercio-actualizado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);
    return () => {
      window.removeEventListener('valhalla:tema-cambiado', sincronizarTema);
      window.removeEventListener('valhalla:comercio-actualizado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
    };
  }, []);

  const tema = obtenerTemaComercio(colorTema);

  const handleStoreRegistered = (storeData) => {
    if (storeData?.colorTema) {
      setColorTema(storeData.colorTema);
    } else {
      setColorTema(leerColorTemaGuardado());
    }

    if (typeof onStoreRegistered === 'function') {
      onStoreRegistered(storeData);
    }
    console.log('[MainLayout] Comercio registrado y activo exitosamente.', storeData || '');
  };

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:${tema.badgeSolido}`}
    >
      {/* Modal encargado del flujo de autenticación, datos del comercio y planes */}
      <StoreSetupModal
        onStoreRegistered={handleStoreRegistered}
        colorTema={tema.id}
      />

      <Navbar
        vistaAdmin={vistaAdmin}
        setVistaAdmin={setVistaAdmin}
        onLogout={onLogout}
        colorTema={tema.id}
      />

      <main className="grow w-full min-w-0 overflow-x-clip">
        {children}
      </main>

      {/* El carrito flotante solo se muestra si NO está en vista de administración */}
      {!vistaAdmin && (
        <CartDrawer
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          colorTema={tema.id}
          tema={tema}
        />
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        colorTema={tema.id}
      />

      <Footer colorTema={tema.id} />
    </div>
  );
};