import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      // Usamos cartItemId si el producto maneja talles, o el id tradicional
      const itemId = product.cartItemId || product.id;
      const existingItem = prevCart.find((item) => (item.cartItemId || item.id) === itemId);
      
      if (existingItem) {
        return prevCart.map((item) =>
          (item.cartItemId || item.id) === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (targetId) => {
    setCart((prevCart) => prevCart.filter((item) => (item.cartItemId || item.id) !== targetId));
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

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  // Soporte seguro por si el producto usa 'precioOferta' o 'precio'
  const totalPrice = cart.reduce((acc, item) => {
    const precioUnitario = Number(item.precioOferta !== undefined ? item.precioOferta : (item.precio || 0));
    return acc + precioUnitario * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};