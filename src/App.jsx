import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { auth } from './services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [vistaAdmin, setVistaAdmin] = useState(true);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Escuchar el estado de autenticación de Google para identificar el comercio
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('valhalla_store_id');
      localStorage.removeItem('valhalla_comercio');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
        <span>Cargando Valhalla Store...</span>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        {/* MainLayout incluye el StoreSetupModal encargado del login, datos del local y planes */}
        <MainLayout vistaAdmin={vistaAdmin} setVistaAdmin={setVistaAdmin} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Home vistaAdmin={vistaAdmin} storeId={user ? user.uid : ''} />} />
          </Routes>
        </MainLayout>
      </Router>
    </CartProvider>
  );
}

export default App;