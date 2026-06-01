"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import FloatingCart from "@/app/components/FloatingCart";

export default function DiaryOfASpecialMumPage() {
  const book = {
    type: "book",
    title: "Diary of a Special Mum",
    price: "$25",
    image: "/book-diary.jpg",
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

      <main className="bg-[#080304] text-white">
        <section className="px-6 pb-28 pt-44">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -70, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-bold uppercase tracking-[0.35em] text-[#ffccd5]">
                Autism Awareness Book
              </p>

              <h1 className="font-display mt-6 text-6xl font-bold leading-none lg:text-8xl">
                Diary of a Special Mum
              </h1>

              <p className="mt-8 text-5xl font-black text-[#ffccd5]">
                $25
              </p>

              <p className="mt-8 text-lg leading-9 text-white/75">
                Foreworded by Cameroon’s legendary communications expert Eric
                CHINJE, this book shares the true life experiences of Delly
                Singah, an award-winning media personality based in London, UK.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/75">
                Based on real life experiences with her 9-year-old autistic son,
                the book offers child-first and society-friendly advice,
                highlighting that autism is not a tragedy.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/75">
                The author looks at autism through a neuro-divergence lens
                rather than a disorder, encouraging special parents to love,
                understand, and support their children on the spectrum while
                managing associated challenges with wisdom and hope.
              </p>

              <div className="mt-10 rounded-[2rem] bg-white/10 p-6">
                <p className="text-lg leading-8 text-white/85">
                  A practical and informative book that breaks stereotypes,
                  dispels myths, reduces stigma, and promotes a more inclusive
                  society for autistic children and persons with special needs.
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
                src="/book-diary.jpg"
                alt="Diary of a Special Mum"
                className="h-[760px] w-full rounded-[2.5rem] bg-white object-contain p-6"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-white p-10 text-center shadow-2xl lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
              About The Book
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none">
              Guidance, hope, and autism awareness.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-black/70">
              As autism affects millions worldwide, this book focuses on how to
              support children on the spectrum and persons with special needs in
              general. It sensitises families and communities while encouraging
              a more informed, inclusive, and compassionate society.
            </p>

            <p className="mx-auto mt-6 max-w-4xl text-lg leading-9 text-black/70">
              It is incredibly useful and informative, full of practical
              scenarios, studies, and reviews that correct misinformation and
              help families pursue better outcomes with autistic children.
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
