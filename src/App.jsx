import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { auth } from './services/firebase'; // Asegúrate de exportar auth desde tu firebase.js
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

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

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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

  // Si no hay usuario autenticado, mostramos la pantalla de Acceso con Google para la tienda
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="bg-yellow-400 text-slate-900 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black shadow-lg mb-6">
            <i className='bx bxs-store-alt'></i>
          </div>

          <h1 className="text-2xl font-black text-white tracking-wider">VALHALLA STORE</h1>
          <p className="text-xs font-bold text-yellow-400 tracking-widest uppercase mt-1">Portal de Comercio</p>
          
          <p className="text-slate-400 text-sm mt-4 mb-8">
            Inicia sesión con tu cuenta de Google autorizada para administrar tu catálogo y ventas en tiempo real.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.35 7.22 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 11.7s.43 3.58 1.19 5.12l4.09-2.55z"/>
              <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.65 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Ingresar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <MainLayout vistaAdmin={vistaAdmin} setVistaAdmin={setVistaAdmin} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Home vistaAdmin={vistaAdmin} storeId={user.uid} />} />
          </Routes>
        </MainLayout>
      </Router>
    </CartProvider>
  );
}

export default App;