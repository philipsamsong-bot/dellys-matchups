"use client";

import { useEffect, useState } from "react";
import FloatingCart from "@/app/components/FloatingCart";
import { motion, AnimatePresence } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const merch = [
  {
    type:"merch",
    title: "Receive Sense T-Shirt",
    price: "$25",
    image:
     "/receivesense2.jpg",
    category: "T-Shirts",
  },
  {
    type:"merch",
    title: "Receive Sense Hoodie",
    price: "$100",
    image:
      "/receivesense1.jpg",
    category: "Hoodies",
  },
  {
    type:"merch",
    title: "Receive Sense Cap",
    price: "$50",
    image:
      "/receivesense-cap.jpg",
    category: "Caps",
  },
  {
    type:"merch",
    title: "Customised Hoodie",
    price: "$100",
    image:
     "/customisedhoodie.png",
    category: "Custom",
  },
  {
    type:"merch",
    title: "Favourite Scriptures T-Shirt",
    price: "$30",
    image:
     "/customised-tshirt.png",
    category: "Faith Collection",
  },
  {
    type:"merch",
    title: "Customised T-Shirt",
    price: "$30",
    image:
      "/customisedt-shirt1.jpg",
    category: "Custom",
  },
];

function addToCart(product) {
  const existingCart = JSON.parse(localStorage.getItem("dm-cart") || "[]");

  existingCart.push(product);

  localStorage.setItem("dm-cart", JSON.stringify(existingCart));

  window.dispatchEvent(new Event("cartUpdated"));
}

export default function MerchPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % merch.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const activeItem = merch[activeIndex];

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

      <main className="bg-[#b30018] text-white">
        <section className="relative overflow-hidden px-6 pb-32 pt-44">
          <div className="mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Delly’s Matchups Merch
              </p>

              <h1 className="font-display mt-6 text-7xl font-bold leading-none md:text-8xl">
                Wear The Message.
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/80">
                Discover premium faith-inspired fashion pieces crafted to
                inspire confidence, identity, healing, and bold
                self-expression.
              </p>

              <div className="mt-10 flex flex-wrap gap-5">
                <a
                  href="#collection"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Shop Collection
                </a>

                <a
                  href="/cart"
                  className="rounded-full border border-white/20 px-10 py-5 text-lg font-black transition hover:bg-white/10"
                >
                  View Cart
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative h-[700px] overflow-hidden rounded-[3rem] bg-[#c1121f] shadow-[0_40px_100px_rgba(0,0,0,0.35)]"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeItem.image}
                  src={activeItem.image}
                  alt={activeItem.title}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.9 }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              <div className="absolute bottom-10 left-10 rounded-[2rem] border border-white/15 bg-[#b30018] p-6 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                  Now Showing
                </p>

                <h3 className="font-display mt-3 text-4xl font-bold">
                  {activeItem.title}
                </h3>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="collection" className="px-6 pb-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                  Featured Collection
                </p>

                <h2 className="font-display mt-5 text-6xl font-bold">
                  Luxury Faith Merch
                </h2>
              </div>

              <p className="max-w-2xl text-lg leading-8 text-white/75">
                Premium designs curated for identity, inspiration, confidence,
                healing, and purpose-driven living.
              </p>
            </div>

            <div className="mt-20 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
              {merch.map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-[3rem] border border-white/10 bg-[#c1121f] shadow-2xl"
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-[420px] w-full object-cover"
                    />

                    <div className="absolute left-6 top-6 rounded-full bg-white px-5 py-2 text-sm font-black text-[#b30018]">
                      {item.category}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <h3 className="text-3xl font-bold">{item.title}</h3>

                        <p className="mt-3 text-lg text-white/75">
                          Delly’s Matchups Merch Collection
                        </p>
                      </div>

                      <p className="text-3xl font-black text-white">
                        {item.price}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          title: item.title,
                          price: item.price,
                          image: item.image,
                        })
                      }
                      className="mt-10 w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                    >
                      Add To Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mx-auto mt-24 max-w-5xl rounded-[3rem] bg-[#c1121f] p-12 text-center shadow-2xl">
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Coming Soon
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold">
                JB’s Collection
              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
                A special collection is coming soon. Stay connected for
                exclusive releases and limited edition pieces.
              </p>
            </div>
          </div>
        </section>
      </main>

      <FloatingCart />

      <SiteFooter />
    </>
  );
}
