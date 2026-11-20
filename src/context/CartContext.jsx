import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
const CLAVE_CARRITO_LOCAL = 'valhalla_carrito';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_CARRITO_LOCAL);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CARRITO_LOCAL, JSON.stringify(cart));
    } catch (error) {
      console.error('Error al guardar el carrito en localStorage:', error);
    }
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      // Usamos cartItemId si el producto maneja talles, o el id tradicional
      const itemId = product.cartItemId || product.id;
      const existingItem = prevCart.find(
        (item) => (item.cartItemId || item.id) === itemId
      );

      if (existingItem) {
        return prevCart.map((item) =>
          (item.cartItemId || item.id) === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (targetId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => (item.cartItemId || item.id) !== targetId)
    );
  };

  const updateQuantity = (targetId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          const itemId = item.cartItemId || item.id;
          if (itemId === targetId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CLAVE_CARRITO_LOCAL);
    } catch {
      // Ignorar errores de almacenamiento
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Soporte seguro por si el producto usa 'precioOferta' o 'precio'
  const totalPrice = cart.reduce((acc, item) => {
    const precioUnitario = Number(
      item.precioOferta !== undefined ? item.precioOferta : item.precio || 0
    );
    return acc + precioUnitario * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};