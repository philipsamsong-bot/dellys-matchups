"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function CheckoutSuccessPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(
      localStorage.getItem("dm-cart") || "[]"
    );

    setCart(savedCart);

    localStorage.removeItem("dm-cart");

    window.dispatchEvent(new Event("cartUpdated"));
  }, []);

  const hasAudio = useMemo(() => {
    return cart.some((item) => item.type === "audio");
  }, [cart]);

  const hasPhysicalProducts = useMemo(() => {
    return cart.some(
      (item) =>
        item.type === "book" ||
        item.type === "merch"
    );
  }, [cart]);

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

      <main className="min-h-screen bg-[#b30018] px-6 pb-28 pt-44 text-white">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16"
          >
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl text-[#b30018]">
              ✓
            </div>

            <p className="mt-10 text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Payment Successful
            </p>

            <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-7xl">
              Thank You For Your Purchase
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-white/80">
              Your order has been received successfully. A confirmation email
              will be sent after deployment and webhook setup.
            </p>

            <div className="mt-14 space-y-6">
              {hasAudio && (
                <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8">
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                    Audio Messages
                  </p>

                  <h2 className="mt-4 text-3xl font-bold">
                    Your Audio Purchase Is Ready
                  </h2>

                  <p className="mt-5 text-lg leading-8 text-white/75">
                    Your premium audio messages will become downloadable and
                    streamable after the final delivery system is connected.
                  </p>
                </div>
              )}

              {hasPhysicalProducts && (
                <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8">
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                    Delivery Information
                  </p>

                  <h2 className="mt-4 text-3xl font-bold">
                    Your Order Will Be Processed
                  </h2>

                  <p className="mt-5 text-lg leading-8 text-white/75">
                    Your books and merchandise will be prepared for shipping
                    using the delivery details submitted during checkout.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-14 flex flex-wrap gap-5">
              <a
                href="/"
                className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Return Home
              </a>

              <a
                href="/shop/books"
                className="rounded-full border border-white/20 px-10 py-5 text-lg font-black transition hover:bg-white/10"
              >
                Continue Shopping
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
