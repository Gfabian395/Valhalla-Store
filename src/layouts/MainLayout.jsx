import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CartDrawer } from '../components/store/CartDrawer';
import { CheckoutModal } from '../components/modals/CheckoutModal';
import { StoreSetupModal } from '../components/modals/StoreSetupModal';

export const MainLayout = ({ children, vistaAdmin, setVistaAdmin, onLogout }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans">
      {/* Modal encargado del flujo de autenticación, datos del comercio y planes */}
      <StoreSetupModal 
        onStoreRegistered={() => {
          // Opcional: recarga o actualiza estados globales si se requiere al registrarse con éxito
          console.log("[MainLayout] Comercio registrado y activo exitosamente.");
        }} 
      />

      <Navbar 
        vistaAdmin={vistaAdmin} 
        setVistaAdmin={setVistaAdmin} 
        onLogout={onLogout} 
      />
      
      <main className="grow w-full">
        {children}
      </main>

      {/* El carrito flotante solo se muestra si NO está en vista de administración */}
      {!vistaAdmin && <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />}
      
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      <Footer />
    </div>
  );
};