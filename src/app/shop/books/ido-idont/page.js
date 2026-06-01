"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import FloatingCart from "@/app/components/FloatingCart";

export default function IDoIDontPage() {
  const book = {
    type: "book",
    title: "I DO, I DON’T",
    price: "$25",
    image: "/ido-idont-book.jpg",
  };

  function addToCart() {
    const existingCart = JSON.parse(localStorage.getItem("dm-cart") || "[]");

    existingCart.push(book);

    localStorage.setItem("dm-cart", JSON.stringify(existingCart));

    window.dispatchEvent(new Event("cartUpdated"));
  }

  return (
    <>
      <SiteNav />

      <main className="bg-[#fff8f5] text-black">
        <section className="px-6 pb-28 pt-44">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
                Relationship & Marriage Book
              </p>

              <h1 className="font-display mt-6 text-6xl font-bold leading-none lg:text-8xl">
                I DO, I DON’T
              </h1>

              <p className="mt-8 text-5xl font-black text-[#b30018]">$25</p>

              <p className="mt-8 text-lg leading-9 text-black/70">
                This book is inspired by a decade of counselling experience and
                godly wisdom.
              </p>

              <p className="mt-6 text-lg leading-9 text-black/70">
                I Do! I Don’t! is a revolutionary book that shows singles how
                to make emotionally intelligent relationship decisions and
                couples how to keep their relationship on track.
              </p>

              <p className="mt-6 text-lg leading-9 text-black/70">
                The book dissects the journey into matrimony, overlaying it
                with fundamental guiding principles that each person must follow
                before saying I Do! or I Don’t!
              </p>

              <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-xl">
                <p className="text-lg leading-8 text-black/70">
                  A practical, wisdom-filled relationship guide for singles,
                  intending couples, and married couples seeking clarity,
                  emotional intelligence, and godly relationship principles.
                </p>
              </div>

              <div className="mt-12 flex flex-wrap gap-5">
                <button
                  type="button"
                  onClick={addToCart}
                  className="rounded-full bg-[#b30018] px-10 py-5 text-lg font-black text-white transition hover:scale-105"
                >
                  Add To Cart
                </button>

                <a
                  href="/shop/books"
                  className="rounded-full border border-[#b30018]/20 px-10 py-5 text-lg font-black text-[#b30018] transition hover:bg-[#b30018] hover:text-white"
                >
                  Back To Books
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] bg-white p-5 shadow-2xl"
            >
              <img
                src="/ido-idont-book.jpg"
                alt="I DO, I DON’T"
                className="h-[760px] w-full rounded-[2.5rem] object-contain"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-[#b30018] px-6 py-32 text-white">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-[#c1121f] p-10 text-center shadow-2xl lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-red-100">
              Secure Purchase
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none">
              Order I DO, I DON’T today.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-white/80">
              Add the book to your cart and complete checkout securely. PayPal
              and MTN Mobile Money payment options will be available during
              checkout.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <button
                type="button"
                onClick={addToCart}
                className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Add To Cart
              </button>

              <a
                href="/contact"
                className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white transition hover:bg-white hover:text-[#b30018]"
              >
                Ask A Question
              </a>
            </div>
          </div>
        </section>

        <FloatingCart />
      </main>

      <SiteFooter />
    </>
  );
}
