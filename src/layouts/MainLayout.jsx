import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CartDrawer } from '../components/store/CartDrawer';
import { CheckoutModal } from '../components/modals/CheckoutModal';
import { StoreSetupModal } from '../components/modals/StoreSetupModal';

export const MainLayout = ({ children, vistaAdmin, setVistaAdmin }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans">
      {/* Modal encargado del flujo de autenticación, datos del comercio y planes */}
      <StoreSetupModal />

      <Navbar vistaAdmin={vistaAdmin} setVistaAdmin={setVistaAdmin} />
      
      <main className="grow w-full">
        {children}
      </main>

      {!vistaAdmin && <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />}
      
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      <Footer />
    </div>
  );
};