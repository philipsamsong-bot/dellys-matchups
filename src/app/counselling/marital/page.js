
"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const sections = [
  {
    title: "Strengthening Communication",
    points: [
      "Learning to communicate with empathy and respect",
      "Resolving misunderstandings effectively",
      "Rebuilding emotional safety and trust",
      "Developing healthy listening habits",
    ],
  },
  {
    title: "Conflict Resolution",
    points: [
      "Managing recurring disagreements",
      "Understanding emotional triggers",
      "Replacing toxic patterns with healthy responses",
      "Learning practical conflict management strategies",
    ],
  },
  {
    title: "Emotional & Spiritual Connection",
    points: [
      "Rekindling emotional intimacy",
      "Restoring friendship within marriage",
      "Spiritual growth as a couple",
      "Supporting one another emotionally",
    ],
  },
  {
    title: "Trust & Healing",
    points: [
      "Healing from betrayal and disappointments",
      "Rebuilding confidence in the relationship",
      "Addressing unresolved emotional wounds",
      "Restoring commitment and stability",
    ],
  },
  {
    title: "Family & Parenting Challenges",
    points: [
      "Managing parenting responsibilities together",
      "Balancing marriage and family demands",
      "Creating healthy family boundaries",
      "Navigating external family pressures",
    ],
  },
  {
    title: "Long-Term Relationship Growth",
    points: [
      "Setting relationship goals",
      "Maintaining romance and connection",
      "Growing together through life transitions",
      "Building a resilient and lasting marriage",
    ],
  },
];

export default function MaritalCounsellingPage() {
  return (
    <>
      <SiteNav />

      <main className="bg-[#b30018] text-white">
        <section className="px-6 pb-28 pt-44">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-3">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-1"
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Marital Counselling
              </p>

              <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
                Restoring Connection, Healing, and Partnership
              </h1>

              <p className="mt-8 text-xl leading-10 text-white/85">
                Marriage comes with challenges, transitions, and seasons that
                require intentional growth. Our marital counselling sessions
                help couples rebuild communication, restore emotional
                connection, and strengthen their relationship foundation.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/counselling/book?service=marital"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Book Marital Counselling
                </a>

                <a
                  href="/counselling"
                  className="rounded-full border border-white/25 px-10 py-5 text-lg font-black transition hover:bg-white/10"
                >
                  Back To Counselling
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="lg:col-span-2"
            >
              <div className="flex min-h-[680px] items-center justify-center overflow-hidden rounded-[3rem] bg-[#7a0010]/40 p-4 shadow-2xl">
                <img
                  src="/marital.png"
                  alt="Marital counselling"
                  className="max-h-[760px] w-full rounded-[2.5rem] object-contain"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-28">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16">
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Why Marital Counselling Matters
              </p>

              <h2 className="mt-6 font-serif text-6xl font-black leading-none">
                Strong marriages require intentional work.
              </h2>

              <p className="mt-8 max-w-5xl text-xl leading-10 text-white/80">
                Every marriage experiences moments of tension, misunderstanding,
                emotional distance, or uncertainty. Counselling provides a safe,
                structured environment for couples to heal, reconnect, and grow
                together intentionally.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {sections.map((section, index) => (
                <motion.article
                  key={section.title}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
                >
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                    {String(index + 1).padStart(2, "0")}
                  </p>

                  <h3 className="mt-5 font-serif text-4xl font-black leading-none">
                    {section.title}
                  </h3>

                  <div className="mt-8 grid gap-4">
                    {section.points.map((point) => (
                      <div
                        key={point}
                        className="rounded-[1.5rem] bg-white/10 p-5 text-lg text-white/85"
                      >
                        {point}
                      </div>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-white p-10 text-center text-[#b30018] shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em]">
              Goal of Marital Counselling
            </p>

            <h2 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
              Helping couples grow together.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-black/70">
              Our goal is to help couples build healthier communication,
              emotional connection, mutual understanding, and long-term
              relationship stability through intentional counselling and
              practical guidance.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/counselling/book?service=marital"
                className="rounded-full bg-[#b30018] px-10 py-5 text-lg font-black text-white transition hover:scale-105"
              >
                Book A Session
              </a>

              <a
                href="/contact"
                className="rounded-full border border-[#b30018]/20 px-10 py-5 text-lg font-black transition hover:bg-[#b30018] hover:text-white"
              >
                Ask A Question
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
