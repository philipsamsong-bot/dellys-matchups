"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const sections = [
  {
    title: "Self-Discovery",
    points: [
      "Understanding your identity",
      "Discovering gifts, talents, and strengths",
      "Identifying limiting beliefs and fears",
      "Recognizing patterns that hold you back",
    ],
  },
  {
    title: "Vision and Direction",
    points: [
      "Clarifying life goals",
      "Identifying passions and purpose areas",
      "Developing intentional life plans",
      "Creating direction for your next season",
    ],
  },
  {
    title: "Confidence and Mindset Building",
    points: [
      "Overcoming self-doubt",
      "Developing confidence and self-worth",
      "Renewing mindset and perspective",
      "Building courage to pursue purpose",
    ],
  },
  {
    title: "Leadership and Personal Growth",
    points: [
      "Becoming intentional about growth",
      "Building discipline and consistency",
      "Developing leadership qualities",
      "Strengthening personal responsibility",
    ],
  },
  {
    title: "Healing and Emotional Awareness",
    points: [
      "Understanding past experiences",
      "Emotional healing and restoration",
      "Letting go of limiting patterns",
      "Growing in emotional maturity",
    ],
  },
  {
    title: "Purpose-Driven Living",
    points: [
      "Aligning your choices with purpose",
      "Building meaningful impact",
      "Living with clarity and intention",
      "Pursuing a fulfilled and impactful life",
    ],
  },
];

export default function PurposeDiscoveryPage() {
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
                Purpose Discovery
              </p>

              <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
                Discovering Why You Exist
              </h1>

              <p className="mt-8 text-xl leading-10 text-white/85">
                One of life’s greatest gifts is understanding who you are and
                why you are here. Our Purpose Discovery sessions help you gain
                clarity, confidence, vision, and direction for a meaningful
                life.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/counselling/book?service=purpose-discovery"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Book Purpose Discovery
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
                  src="/purpose.jpg"
                  alt="Purpose discovery"
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
                Why Purpose Discovery Matters
              </p>

              <h2 className="mt-6 font-serif text-6xl font-black leading-none">
                Clarity changes everything.
              </h2>

              <p className="mt-8 max-w-5xl text-xl leading-10 text-white/80">
                Many people struggle with confusion, stagnation, low
                self-esteem, lack of direction, or unfulfilled potential simply
                because they have not yet discovered their purpose.
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
              Goal of Purpose Discovery
            </p>

            <h2 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
              Gain clarity. Unlock potential.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-black/70">
              Our aim is to help individuals gain clarity, unlock potential,
              build confidence, and pursue meaningful, impactful, and
              purpose-driven lives.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/counselling/book?service=purpose-discovery"
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
