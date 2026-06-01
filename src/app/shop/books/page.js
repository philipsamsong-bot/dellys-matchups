"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import FloatingCart from "@/app/components/FloatingCart";

const books = [
  {
    type:"book",
    title: "I DO, I DON’T",
    year: "2023",
    price: "$25",
    image: "/ido-idont-book.jpg",
    description:
      "Inspired by a decade of counselling experience and godly wisdom, this transformational book helps singles make emotionally intelligent relationship decisions and equips couples with principles for building lasting, healthy marriages.",
    link: "/shop/books/ido-idont",
  },
  {
    type:"book",
    title: "Diary of a Special Mum",
    year: "2024",
    price: "$25",
    image: "/book-diary.jpg",
    description:
    "Foreworded by Eric CHINJE, this inspiring book shares Delly Singah's real-life experiences as a special-needs parent, offering practical insights, hope, and autism awareness while challenging stereotypes and reducing stigma.",
    link: "/shop/books/diary-of-a-special-mum",
  },
  {
    type:"book",
    title: "Adventures of Delphine",
    year: "2025",
    price: "$40",
    image: "/book-adventures.jpg",
    description:
      "Foreworded by Dr. Richard Munang. A collection of 30 independent, fun, heartfelt childwood stories inspired by real-life experiences. Set in Mulang, the book follows Delphine through family, friendships, school, chores, discipline, laughter, mistakes, and life lessons. A 220-page independently published book suitable for all ages.",
    link: "/shop/books/adventures-of-delphine",
  },
  {
    type:"book",
    title: "Journal d'une Maman Spéciale",
    year:"2024",
    price:"$25",
    image: "/journal-maman-speciale.jpg",
    description:
    "The French edition of Diary of a Special Mum, offering encouragement,resilience,autism awareness,and hope for mothers,families, and caregivers.",
    link: "/shop/books/journal-d'une-maman-spécial",

  }
];
   function addToCart(product){
    const existingCart=JSON.parse(
    localStorage.getItem("dm-cart")
    || "[]"
   );
    existingCart.push(product);

    localStorage.setItem(
        "dm-cart",
        JSON.stringify(existingCart)
);
window.dispatchEvent(new
    Event("cartUpdated"));
}
export default function BooksPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

        body {
          margin: 0;
          background: #080304;
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        .font-display {
          font-family: "Cormorant Garamond", serif;
        }
      `}</style>

      <SiteNav />

      <main className="overflow-hidden bg-[#080304] text-white">
      <section className="relative min-h-screen overflow-hidden">
  <div className="absolute inset-0">
    <img
      src="/ido-idont-book.jpg"
      alt="Delly Singah Books"
      className=" absolute right-[-200px] top-2 h-full w-auto max-w-none object-cover"
    />

    <div className="absolute inset-0 bg-black/5" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
  </div>

  <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-40">
    <motion.div
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1 }}
      className="max-w-4xl rounded-[3rem] border border-white/15 bg-black/35 p-8 shadow-2xl backdrop-blur-sm lg:p-14"
    >
      <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
        Delly Singah Books
      </p>

      <h1 className="font-display mt-8 text-6xl font-bold leading-[0.9] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,0.75)] lg:text-8xl">
        Wisdom for Love,
        <span className="block text-[#ffccd5]">
          Healing & Purpose
        </span>
      </h1>

      <p className="mt-10 max-w-3xl text-xl leading-10 text-white/95 drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)]">
        Explore transformational books by Delly Singah designed to inspire
        healthy relationships, intentional marriage, emotional healing,
        motherhood, purpose and godly living.
      </p>

      <div className="mt-12 flex flex-wrap gap-5">
        <a
          href="#books"
          className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
        >
          Shop Books
        </a>

        <a
          href="/about/founder"
          className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
        >
          About The Author
        </a>
      </div>
    </motion.div>
  </div>
</section>
 

        <section id="books" className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
                Book Collection
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Transformational books for every season.
              </h2>

              <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-black/70">
                Each book carries practical wisdom, emotional depth, faith-based
                guidance and transformational insight for relationships, family,
                healing and purpose.
              </p>
            </motion.div>

            <div className="mt-20 grid gap-10 lg:grid-cols-3">
              {books.map((book, index) => (
                <motion.div
                  key={book.title}
                  initial={{ y: 70, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col overflow-hidden rounded-[3rem] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.12)]"
                >
                  <div className="bg-[#fff8f5] p-6">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="h-[460px] w-full rounded-[2.3rem] object-contain bg-white p-4"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-8">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-[#b30018]">
                      {book.year}
                    </p>

                    <h3 className="font-display mt-4 text-5xl font-bold leading-none">
                      {book.title}
                    </h3>

                    <p className="mt-5 text-4xl font-black text-[#b30018]">
                      {book.price}
                    </p>

                    <p className="mt-6 flex-1 text-lg leading-8 text-black/70">
                      {book.description}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                      <a
                        href={book.link}
                        className="rounded-full bg-[#b30018] px-7 py-4 font-black text-white transition hover:scale-105"
                      >
                        View Details
                      </a>

                      <button
                      type="button"
                      onClick={()=>
                        addToCart({
                            title:book.title,
                            price:book.price,
                            image:book.image,
                        })
                      }
                      className="rounded-full border border-[#b30018]/20 px-7 py-4 font-black text-[#b30018] transition hover:bg-red-50"
                      >
                        Add To Cart 
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#080304] px-6 py-32 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-bold uppercase tracking-[0.35em] text-red-200">
                About The Author
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Books born from wisdom, experience and purpose.
              </h2>

              <p className="mt-8 text-lg leading-9 text-white/75">
                Delly Singah is a relationship mentor, counsellor, author,
                humanitarian, media personality, wife and mother whose writings
                inspire healing, purposeful relationships, family values and
                transformational living.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/75">
                Through her books, teachings and mentorship, she continues to
                empower individuals and families with wisdom rooted in practical
                life experience and Biblical principles.
              </p>

              <a
                href="/about/founder"
                className="mt-10 inline-flex rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Meet Delly Singah
              </a>
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
            >
              <img
                src="/founder-book.jpg"
                alt="Delly Singah Author"
                className="h-[760px] w-full rounded-[2.5rem] object-cover"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-white p-10 text-center shadow-[0_30px_90px_rgba(0,0,0,0.10)] lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
              Secure Purchase
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none">
              Order your copy today.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-black/70">
              Purchase books directly from Delly’s Matchups. Secure payment,
              order confirmation and delivery details will be handled during
              checkout.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="#books"
                className="rounded-full bg-[#b30018] px-10 py-5 text-lg font-black text-white transition hover:scale-105"
              >
                Browse Books
              </a>

              <a
                href="/contact"
                className="rounded-full border border-[#b30018]/20 px-10 py-5 text-lg font-black text-[#b30018]"
              >
                Ask A Question
              </a>
            </div>
          </div>
        </section>
        <FloatingCart/>
      </main>

      <SiteFooter />
    </>
  );
}