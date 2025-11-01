"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CartItemBook {
  _id: string;
  title: string;
  author: string;
  imageUrl?: string;
  condition: string;
  owner: {
    _id: string;
    username: string;
    email: string;
    location?: string;
    profileImage?: string;
    averageRating?: number;
  };
}

interface CartItem {
  book: CartItemBook;
  addedAt: string;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  addToCart: (bookId: string) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!session) {
      setCart([]);
      return;
    }

    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data: { cart?: { items: CartItem[] } } = await res.json();
        setCart(data.cart?.items || []);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [session]);

  const addToCart = async (bookId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!res.ok) {
        const error: { error?: string } = await res.json();
        throw new Error(error.error || "Failed to add to cart");
      }

      const data: { cart?: { items: CartItem[] } } = await res.json();
      setCart(data.cart?.items || []);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (bookId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart/${bookId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove from cart");
      }

      const data: { cart?: { items: CartItem[] } } = await res.json();
      setCart(data.cart?.items || []);
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.length,
        addToCart,
        removeFromCart,
        refreshCart,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
