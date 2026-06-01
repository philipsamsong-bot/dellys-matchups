"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

function getPriceNumber(price) {
  return Number(String(price).replace("$", "")) || 0;
}

export default function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("dm-cart") || "[]");
    setCart(savedCart);
  }, []);

  const total = cart.reduce((sum, item) => sum + getPriceNumber(item.price), 0);

  function updateCart(nextCart) {
    setCart(nextCart);
    localStorage.setItem("dm-cart", JSON.stringify(nextCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function removeItem(indexToRemove) {
    const nextCart = cart.filter((_, index) => index !== indexToRemove);
    updateCart(nextCart);
  }

  function clearCart() {
    updateCart([]);
  }

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

        body {
          margin: 0;
          background: #b30018;
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        .font-display {
          font-family: "Cormorant Garamond", serif;
        }
      `}</style>

      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Shopping Cart
            </p>

            <h1 className="font-display mt-6 text-7xl font-bold leading-none">
              Your Cart
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              Review your books, merch, audio messages, and digital products
              before checkout.
            </p>
          </motion.div>

          {cart.length === 0 ? (
            <div className="mt-16 rounded-[3rem] bg-[#c1121f] p-12 text-center shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                Your cart is empty
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-white/75">
                Browse the shop and add your favourite products to continue.
              </p>

              <a
                href="/shop/books"
                className="mt-10 inline-flex rounded-full bg-white px-10 py-5 font-black text-[#b30018] transition hover:scale-105"
              >
                Browse Shop
              </a>
            </div>
          ) : (
            <div className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_0.7fr]">
              <div className="space-y-6">
                {cart.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex flex-col gap-6 rounded-[2.5rem] bg-[#c1121f] p-6 shadow-2xl md:flex-row md:items-center"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-36 w-full rounded-[2rem] bg-white object-cover md:w-36"
                    />

                    <div className="flex-1">
                      <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#b30018]">
                        {item.type || "product"}
                      </span>

                      <h2 className="mt-5 text-3xl font-black">
                        {item.title}
                      </h2>

                      <p className="mt-3 text-2xl font-black text-red-100">
                        {item.price}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-full border border-white/20 px-6 py-3 font-bold transition hover:bg-white hover:text-[#b30018]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <aside className="h-fit rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl">
                <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                  Order Summary
                </p>

                <h2 className="font-display mt-5 text-5xl font-bold">
                  Summary
                </h2>

                <div className="mt-10 space-y-5 border-b border-white/15 pb-8">
                  <div className="flex justify-between">
                    <span className="text-white/75">Items</span>
                    <span className="font-black">{cart.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/75">Delivery</span>
                    <span className="font-black">Calculated Later</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <span className="text-xl font-black">Total</span>
                  <span className="text-5xl font-black">${total}</span>
                </div>

                <a
                  href="/checkout"
                  className="mt-10 block rounded-full bg-white py-5 text-center text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Proceed To Checkout
                </a>

                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-5 w-full rounded-full border border-white/20 py-4 font-bold transition hover:bg-white hover:text-[#b30018]"
                >
                  Clear Cart
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
