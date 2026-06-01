"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function CheckoutCancelPage() {
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

      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#7a0010] via-[#b30018] to-[#ff4d6d] px-6 py-40 text-white">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl rounded-[3rem] border border-white/15 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-xl md:p-20"
        >
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/15 text-6xl">
            ×
          </div>

          <p className="mt-10 text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Payment Cancelled
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-7xl">
            Your Order Was Not Completed
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/80">
            No payment was taken. Your cart is still saved, so you can return
            and complete your purchase whenever you are ready.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <a
              href="/checkout"
              className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
            >
              Try Checkout Again
            </a>

            <a
              href="/cart"
              className="rounded-full border border-white/20 px-10 py-5 text-lg font-black transition hover:bg-white/10"
            >
              Return To Cart
            </a>
          </div>

          <div className="mt-16 rounded-[2rem] border border-white/10 bg-black/10 p-8 text-left">
            <h2 className="text-2xl font-bold">
              What Happened?
            </h2>

            <div className="mt-8 space-y-5 text-white/75">
              <p>
                • Your Stripe checkout session was cancelled before completion.
              </p>

              <p>
                • Your products are still safely stored inside your cart.
              </p>

              <p>
                • You can retry payment anytime without losing your selected items.
              </p>

              <p>
                • If payment issues continue, contact Delly’s Matchups support.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <SiteFooter />
    </>
  );
}
