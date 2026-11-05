import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';

function App() {
  const [vistaAdmin, setVistaAdmin] = useState(true);

  return (
    <CartProvider>
      <Router>
        <MainLayout vistaAdmin={vistaAdmin} setVistaAdmin={setVistaAdmin}>
          <Routes>
            <Route path="/" element={<Home vistaAdmin={vistaAdmin} />} />
          </Routes>
        </MainLayout>
      </Router>
    </CartProvider>
  );
}

export default App;