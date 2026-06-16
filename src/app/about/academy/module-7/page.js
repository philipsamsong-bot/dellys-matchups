"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function ModuleSevenPage() {
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
              src="/gallery6.jpg"
              alt="Virginity 101"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/70" />

            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-40">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="max-w-5xl"
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-200">
                Module 7
              </p>

              <h1 className="font-display mt-8 text-7xl font-bold leading-[0.9] lg:text-9xl">
                Virginity 101
              </h1>

              <p className="mt-8 max-w-4xl text-2xl font-bold text-[#ffccd5]">
                Preserving Purity, Purpose & Self-Worth
              </p>

              <p className="mt-8 max-w-4xl text-xl leading-10 text-white/80">
                A transformational course designed to help young people
                understand purity, self-worth, discipline, emotional
                intelligence, healthy relationships, and God’s design for
                intimacy and marriage.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/academy/checkout?course=module-7"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Pay & Enroll
                </a>

                <a
                  href="/about/academy"
                  className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                >
                  Back To Academy
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
                Course Overview
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Teaching purity, discipline and intentional living.
              </h2>

              <p className="mt-8 text-lg leading-9 text-black/70">
                Virginity 101 focuses on helping young people understand the
                value of purity, emotional discipline, self-respect, healthy
                boundaries, identity, and God’s purpose for relationships,
                intimacy, and marriage.
              </p>

              <p className="mt-6 text-lg leading-9 text-black/70">
                This course addresses the pressures of modern society while
                empowering students with wisdom, confidence, emotional maturity,
                and practical tools for healthy future relationships.
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] border border-black/10 bg-white p-4 shadow-2xl"
            >
              <img
                src="/gallery7.png"
                alt="Virginity 101"
                className="h-[720px] w-full rounded-[2.5rem] object-cover"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-[#080304] px-6 py-32 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="font-bold uppercase tracking-[0.35em] text-red-200">
                Topics Covered
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Purity, identity and healthy relationship foundations.
              </h2>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                "The Concept of Virginity",
                "Emotional & Physical Purity",
                "Why Keep Yourself?",
                "Boundaries & Self-Control",
                "Peer Pressure & Modern Society",
                "Secondary Virginity",
                "Healing & Restoration",
                "Purpose & Identity",
              ].map((topic, index) => (
                <motion.div
                  key={topic}
                  initial={{ y: 60, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl"
                >
                  <p className="text-xl font-bold text-white">{topic}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto max-w-7xl rounded-[3rem] bg-white p-10 shadow-[0_30px_90px_rgba(0,0,0,0.10)] lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
              Purpose & Transformation
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
              Building confidence, discipline and self-worth.
            </h2>

            <p className="mt-8 max-w-5xl text-lg leading-9 text-black/70">
              Students are equipped with emotional intelligence, practical
              wisdom, healthy relationship principles, self-respect,
              discipline, identity awareness, and intentional lifestyle choices
              that support long-term personal growth and healthy future
              marriages.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                "Healthy boundaries",
                "Emotional discipline",
                "Identity & purpose",
                "Confidence & self-worth",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[2rem] border border-black/10 bg-[#fff8f5] p-8 shadow-lg"
                >
                  <p className="text-2xl font-bold text-[#b30018]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#b30018] px-6 py-32 text-white">
          <div className="mx-auto max-w-6xl rounded-[3rem] border border-white/10 bg-black/20 p-10 text-center shadow-2xl backdrop-blur-xl lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-red-100">
              Outcome
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none">
              Live intentionally with wisdom, purity and confidence.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-10 text-white/85">
              Students gain confidence, emotional maturity, practical wisdom,
              healthy relationship understanding, self-control, and tools for
              intentional living, healing, and building healthy future
              relationships and marriages.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/academy/checkout?course=module-7"
                className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Pay & Enroll
              </a>

              <a
                href="/about/academy"
                className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
              >
                Back To Academy
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
