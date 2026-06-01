"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const sections = [
  {
    title: "Understanding Emotional Pain",
    points: [
      "Identifying hidden emotional wounds",
      "Recognising unhealthy emotional patterns",
      "Understanding trauma and emotional triggers",
      "Learning emotional awareness",
    ],
  },
  {
    title: "Healing From Heartbreak",
    points: [
      "Recovering from painful relationships",
      "Processing grief and disappointment",
      "Restoring emotional stability",
      "Learning to trust again",
    ],
  },
  {
    title: "Self-Worth & Identity",
    points: [
      "Rebuilding confidence and self-esteem",
      "Overcoming rejection and insecurity",
      "Developing a healthy self-image",
      "Understanding personal value",
    ],
  },
  {
    title: "Emotional Restoration",
    points: [
      "Managing anxiety and emotional stress",
      "Finding inner peace and stability",
      "Developing emotional maturity",
      "Creating healthy coping mechanisms",
    ],
  },
  {
    title: "Forgiveness & Letting Go",
    points: [
      "Releasing bitterness and resentment",
      "Healing from past emotional damage",
      "Learning healthy forgiveness",
      "Moving forward with freedom",
    ],
  },
  {
    title: "Growth & Transformation",
    points: [
      "Building healthier emotional habits",
      "Creating positive relationship patterns",
      "Growing spiritually and emotionally",
      "Living with renewed clarity and purpose",
    ],
  },
];

export default function EmotionalHealingPage() {
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
                Emotional Healing
              </p>

              <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
                Healing Deep Emotional Wounds
              </h1>

              <p className="mt-8 text-xl leading-10 text-white/85">
                Emotional pain, heartbreak, trauma, rejection, and unresolved
                experiences can affect every area of life. Our Emotional Healing
                sessions provide guidance, support, healing, and restoration for
                individuals seeking peace, clarity, and emotional growth.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/counselling/book?service=emotional-healing"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Book Emotional Healing
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
                  src="/healing.jpg"
                  alt="Emotional healing"
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
                Why Emotional Healing Matters
              </p>

              <h2 className="mt-6 font-serif text-6xl font-black leading-none">
                Healing is possible.
              </h2>

              <p className="mt-8 max-w-5xl text-xl leading-10 text-white/80">
                Unhealed emotional wounds often affect relationships,
                confidence, mental well-being, spiritual growth, and personal
                peace. Healing creates room for restoration, freedom, growth,
                and healthier living.
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
              Goal of Emotional Healing
            </p>

            <h2 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
              Healing. Restoration. Growth.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-black/70">
              Our goal is to help individuals heal emotionally, rebuild
              confidence, restore peace, overcome emotional pain, and move
              forward with healthier perspectives and renewed strength.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/counselling/book?service=emotional-healing"
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
