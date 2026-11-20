import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { CatalogoPublico } from './pages/CatalogoPublico'; // 🟢 Vista pública para los clientes del QR
import { auth } from './services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { obtenerTemaComercio } from './utils/temasComercio';

const leerColorTemaGuardado = () => {
  try {
    const comercioGuardado = JSON.parse(localStorage.getItem('valhalla_comercio')) || {};
    return comercioGuardado.colorTema || 'emerald';
  } catch {
    return 'emerald';
  }
};

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
      window.dispatchEvent(
        new CustomEvent('valhalla:tema-cambiado', { detail: { colorTema: 'emerald' } })
      );
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const temaInicial = obtenerTemaComercio(leerColorTemaGuardado());

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300 font-mono text-xs">
        <div
          className={`w-8 h-8 border-2 border-slate-700 border-t-current rounded-full animate-spin ${temaInicial.subtituloBanner}`}
        />
        <span>Cargando Valhalla Store...</span>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* 🟢 Ruta pública exclusiva para los clientes que escanean el código QR del folleto */}
          <Route path="/store/:storeId" element={<CatalogoPublico />} />

          {/* Rutas administrativas del comerciante (envueltas en MainLayout con autenticación y setup) */}
          <Route
            path="/*"
            element={
              <MainLayout
                vistaAdmin={vistaAdmin}
                setVistaAdmin={setVistaAdmin}
                onLogout={handleLogout}
              >
                <Routes>
                  <Route
                    path="/"
                    element={<Home vistaAdmin={vistaAdmin} storeId={user ? user.uid : ''} />}
                  />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;