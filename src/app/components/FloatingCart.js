"use client";

import { useEffect, useState } from "react";

function getCartCount() {
  if (typeof window === "undefined") return 0;

  const cart = JSON.parse(localStorage.getItem("dm-cart") || "[]");
  return cart.length;
}

export default function FloatingCart() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getCartCount());
    };

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <a
      href="/cart"
      className="fixed right-6 top-36 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:scale-110"
    >
      🛒

      <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#b30018] text-xs font-black text-white">
        {cartCount}
      </span>
    </a>
  );
}
