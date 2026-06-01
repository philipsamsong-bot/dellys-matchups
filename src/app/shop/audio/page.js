"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FloatingCart from "@/app/components/FloatingCart";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const audioMessages = [
  {
    type:"audio",
    title: "Healing After Heartbreak",
    category: "Healing",
    price: "$25",
    duration: "18 mins",
    image: "/thumbnail2.png",
    preview:"/healing.m4a",
    description:
      "A transformational message focused on healing emotionally and spiritually after heartbreak.",
  },
  {
    type:"audio",
    title: "Knowing Your Worth",
    category: "Self Worth",
    price: "$20",
    duration: "12 mins",
    image: "/thumbnail2.png",
    description:
      "Learn confidence, identity, boundaries, and self-value in relationships.",
  },
  {
    type:"audio",
    title: "Godly Relationships",
    category: "Faith",
    price: "$30",
    duration: "24 mins",
    image: "/thumbnail2.png",
    description:
      "Biblical principles for healthy, intentional, and purpose-driven relationships.",
  },
  {
    type:"audio",
    title: "Dating With Purpose",
    category: "Dating",
    price: "$20",
    duration: "16 mins",
    image: "/thumbnail2.png",
    description:
      "A luxury relationship mindset guide for intentional dating and emotional maturity.",
  },
  {
    type:"audio",
    title: "How To Let Go",
    category: "Healing",
    price: "$25",
    duration: "14 mins",
    image: "/thumbnail2.png",
    description:
      "Learn how to emotionally release unhealthy attachments and embrace peace.",
  },
  {
    type:"audio",
    title: "Building Emotional Intelligence",
    category: "Growth",
    price: "$35",
    duration: "28 mins",
    image: "/thumbnail2.png",
    description:
      "Master communication, emotional awareness, and emotional control in relationships.",
  },
];

function addToCart(product) {
  const existingCart = JSON.parse(
    localStorage.getItem("dm-cart") || "[]"
  );

  existingCart.push(product);

  localStorage.setItem(
    "dm-cart",
    JSON.stringify(existingCart)
  );

  window.dispatchEvent(new Event("cartUpdated"));
}

export default function AudioMessagesPage() {
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const categories = [
    "All",
    "Healing",
    "Faith",
    "Dating",
    "Growth",
    "Self Worth",
  ];

  const filteredMessages =
    selectedCategory === "All"
      ? audioMessages
      : audioMessages.filter(
          (message) =>
            message.category === selectedCategory
        );

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

        body {
          margin: 0;
          background: #7a0010;
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        .font-display {
          font-family: "Cormorant Garamond", serif;
        }
      `}</style>

      <SiteNav />

      <main className="bg-[#7a0010] text-white">
        <section className="px-6 pb-24 pt-44">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <p className="text-sm font-black uppercase tracking-[0.5em] text-red-200">
                Delly’s Matchups
              </p>

              <h1 className="font-display mt-6 text-7xl font-bold md:text-8xl">
                Audio Messages
              </h1>

              <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-white/80">
                Luxury transformational audio experiences
                designed for healing, faith, confidence,
                intentional relationships, and emotional growth.
              </p>
            </motion.div>

            <div className="mt-14 flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.2em] transition ${
                    selectedCategory === category
                      ? "bg-white text-[#7a0010]"
                      : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-20 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
              {filteredMessages.map((message) => (
                <motion.div
                  key={message.title}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 backdrop-blur-xl"
                >
                  <div className="relative">
                    <img
                      src={message.image}
                      alt={message.title}
                      className="h-[320px] w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/20" />

                    <div className="absolute left-6 top-6 rounded-full bg-white px-5 py-2 text-sm font-black text-[#7a0010]">
                      {message.category}
                    </div>

                    <div className="absolute bottom-6 right-6 rounded-full bg-black/40 px-5 py-2 text-sm font-bold backdrop-blur-xl">
                      {message.duration}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-3xl font-bold leading-tight">
                        {message.title}
                      </h3>

                      <p className="text-2xl font-black text-red-100">
                        {message.price}
                      </p>
                    </div>

                    <p className="mt-5 text-lg leading-8 text-white/75">
                      {message.description}
                    </p>

                    <div className="mt-8">
                      <audio controls className=" w-full">
                        <source src={message.preview}
                        type="audio/mp4"/>
                      </audio>

                      <button
                      type="button"
                        onClick={() =>{
                          addToCart({
                            type:"audio",
                            title: message.title,
                            price: message.price,
                            image: message.image,
                          });

                          window.location.href="/cart";
                        }}
                    
                        className="mt-5 rounded-full bg-white px-6 py-3 font-black text-[#7a0010] transition hover:scale-105"
                      >
                        Buy Now
                      </button>
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <FloatingCart />

      <SiteFooter />
    </>
  );
}
