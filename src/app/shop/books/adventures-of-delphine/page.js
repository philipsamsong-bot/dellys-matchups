"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import FloatingCart from "@/app/components/FloatingCart";

export default function AdventuresOfDelphinePage() {
  const book = {
    type: "book",
    title: "Adventures of Delphine",
    price: "$40",
    image: "/book-adventures.jpg",
  };

  function addToCart() {
    const existingCart = JSON.parse(
      localStorage.getItem("dm-cart") || "[]"
    );

    existingCart.push(book);

    localStorage.setItem(
      "dm-cart",
      JSON.stringify(existingCart)
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  return (
    <>
      <SiteNav />

      <main className="bg-[#080304] text-white">
        <section className="px-6 pb-28 pt-44">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-bold uppercase tracking-[0.35em] text-[#ffccd5]">
                Latest Book
              </p>

              <h1 className="font-display mt-6 text-6xl font-bold leading-none lg:text-8xl">
                Adventures of Delphine
              </h1>

              <p className="mt-8 text-5xl font-black text-[#ffccd5]">
                $40
              </p>

              <p className="mt-8 text-lg leading-9 text-white/75">
                Adventures of Delphine is a collection of 30 independent,
                fun, heartfelt childhood stories inspired by real-life
                experiences. Set in the lively community of Mulang, the
                book shows Delphine as she navigates family,
                friendships, school, chores, and the lessons taught by
                her firm but caring Papa.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/75">
                Through laughter, mistakes, and small victories, each
                story shares a simple moral that helps young readers
                grow. This book celebrates African childhood, strong
                values, the nostalgia of yesteryears and the joy of
                growing up in a community wrapped in discipline.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/75">
                Adventures of Delphine is only the beginning of a TV
                series that captures a well-lived childhood. Happy
                reading!
              </p>

              <div className="mt-10 rounded-[2rem] bg-white/10 p-6">
                <p className="text-lg leading-8 text-white/85">
                  The book is 220 pages, published independently, and
                  suitable for all ages.
                </p>
              </div>

              <div className="mt-12 flex flex-wrap gap-5">
                <button
                  type="button"
                  onClick={addToCart}
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Add To Cart
                </button>

                <a
                  href="/shop/books"
                  className="rounded-full border border-white/20 px-10 py-5 text-lg font-black text-white transition hover:bg-white hover:text-[#b30018]"
                >
                  Back To Books
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
            >
              <img
                src="/book-adventures.jpg"
                alt="Adventures of Delphine"
                className="h-[760px] w-full rounded-[2.5rem] bg-white object-contain p-6"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-white p-10 text-center shadow-2xl lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
              Secure Purchase
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none">
              Order Adventures of Delphine today.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-black/70">
              Add the book to your cart and complete checkout securely.
              PayPal and MTN Mobile Money payment options will be
              available during checkout.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <button
                type="button"
                onClick={addToCart}
                className="rounded-full bg-[#b30018] px-10 py-5 text-lg font-black text-white transition hover:scale-105"
              >
                Add To Cart
              </button>

              <a
                href="/contact"
                className="rounded-full border border-[#b30018]/20 px-10 py-5 text-lg font-black text-[#b30018]"
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
