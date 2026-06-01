"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const sections = [
  {
    title: "Revisiting the Purpose of Marriage",
    points: [
      "Understanding God’s intention for marriage",
      "Marriage beyond weddings and social expectations",
      "Roles, responsibilities, and partnership",
    ],
  },
  {
    title: "Self-Discovery and Identity",
    points: [
      "Knowing yourself before committing to another person",
      "Emotional maturity and healing",
      "Personal values, strengths, and weaknesses",
      "Understanding personality types and behavioural patterns",
    ],
  },
  {
    title: "Compatibility Assessment",
    points: [
      "Communication",
      "Values and beliefs",
      "Emotional connection",
      "Spiritual alignment",
      "Family expectations",
      "Financial perspectives",
      "Career goals",
      "Intimacy expectations",
      "Conflict resolution styles",
      "Long-term life vision",
    ],
  },
  {
    title: "Communication and Conflict Resolution",
    points: [
      "Healthy communication techniques",
      "Understanding misunderstandings",
      "Managing disagreements maturely",
      "Building trust, patience, and emotional safety",
    ],
  },
  {
    title: "Marriage Expectations and Reality",
    points: [
      "Unrealistic expectations vs reality",
      "Love languages and emotional needs",
      "Commitment, sacrifice, and partnership",
      "Balancing individuality and togetherness",
    ],
  },
  {
    title: "Intimacy and Boundaries",
    points: [
      "Emotional and physical boundaries",
      "Purity, respect, and intentional dating",
      "Building healthy intimacy before and after marriage",
    ],
  },
];

export default function PremaritalCounsellingPage() {
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
                Premarital Counselling
              </p>

              <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
                Building the Right Foundation Before “I Do”
              </h1>

              <p className="mt-8 text-xl leading-10 text-white/85">
                Marriage is one of life’s biggest commitments, and preparation
                is essential. This program helps intending couples build a
                strong emotional, spiritual, mental, and practical foundation
                before marriage.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/counselling/book?service=premarital"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Book Premarital Counselling
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
                  src="/premarital.png"
                  alt="Premarital counselling"
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
                Why Premarital Counselling Matters
              </p>

              <h2 className="mt-6 font-serif text-6xl font-black leading-none">
                Preparation prevents unnecessary pain.
              </h2>

              <p className="mt-8 max-w-5xl text-xl leading-10 text-white/80">
                Many relationship challenges can be prevented when couples
                intentionally prepare emotionally, spiritually, mentally, and
                practically before marriage.
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
              Goal of Premarital Counselling
            </p>

            <h2 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
              Beyond the wedding day.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-black/70">
              Our goal is not simply to prepare couples for a wedding day, but
              to equip them for a healthy, stable, fulfilling, and purposeful
              marriage journey.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/counselling/book?service=premarital"
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
