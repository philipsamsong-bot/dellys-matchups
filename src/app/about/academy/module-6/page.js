"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function ModuleSixPage() {
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
              src="/gallery4.jpg"
              alt="Master Classes"
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
                Module 6
              </p>

              <h1 className="font-display mt-8 text-7xl font-bold leading-[0.9] lg:text-9xl">
                MASTER CLASSES
              </h1>

              <p className="mt-8 max-w-4xl text-2xl font-bold text-[#ffccd5]">
                Specialized Transformational Programs
              </p>

              <p className="mt-8 max-w-4xl text-xl leading-10 text-white/80">
                A collection of practical and transformational short programs
                designed to address real-life relationship, emotional,
                leadership, communication, family, and personal development
                challenges affecting individuals and communities today.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/academy/checkout?course=module-6"
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
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
                Program Overview
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Practical classes for real-life transformation.
              </h2>

              <p className="mx-auto mt-8 max-w-5xl text-lg leading-9 text-black/70">
                The Master Classes are designed to provide practical knowledge,
                emotional healing tools, relationship wisdom, mentorship
                principles, leadership insights, and transformational guidance
                for modern-day challenges affecting individuals, couples,
                families, and communities.
              </p>
            </motion.div>

            <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Social Media & Relationships",
                "Pornography Addiction Recovery",
                "Financial Wisdom for Couples",
                "Parenting & Family Building",
                "Communication Mastery",
                "Boundaries & Self-Respect",
                "Healing After Divorce or Breakup",
                "Christian Courtship Principles",
                "Becoming an Effective Mentor",
                "Public Speaking & Confidence",
                "Building Healthy Families",
                "Psychological First Aid",
              ].map((topic, index) => (
                <motion.div
                  key={topic}
                  initial={{ y: 60, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-xl"
                >
                  <p className="text-2xl font-bold text-[#b30018]">
                    {topic}
                  </p>
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
                Why These Classes Matter
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Relevant teachings for modern-day realities.
              </h2>

              <p className="mt-8 text-lg leading-9 text-white/75">
                These specialized classes focus on real issues many people face
                daily — emotional struggles, unhealthy relationships, addiction,
                communication breakdowns, identity struggles, family issues,
                leadership challenges, and personal growth barriers.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/75">
                Through wisdom, mentorship, practical tools, and Biblical
                principles, students receive guidance capable of producing
                lasting transformation in every area of life.
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
            >
              <img
                src="/academy10.jpg"
                alt="Master Classes"
                className="h-[720px] w-full rounded-[2.5rem] object-cover"
              />
            </motion.div>
          </div>
        </section>

        <section className="bg-[#fff8f5] px-6 py-32 text-black">
          <div className="mx-auto max-w-7xl rounded-[3rem] bg-white p-10 shadow-[0_30px_90px_rgba(0,0,0,0.10)] lg:p-16">
            <p className="font-bold uppercase tracking-[0.35em] text-[#b30018]">
              Transformation Focus
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
              Helping people grow emotionally, mentally and spiritually.
            </h2>

            <p className="mt-8 max-w-5xl text-lg leading-9 text-black/70">
              Every master class is intentionally designed to help individuals
              build healthier relationships, strengthen emotional intelligence,
              improve communication, develop leadership capacity, restore
              confidence, and pursue purposeful living with wisdom and clarity.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                "Practical relationship wisdom",
                "Emotional healing tools",
                "Personal growth strategies",
                "Transformational mentorship",
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
              Gain wisdom, healing, clarity and transformational insight.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-10 text-white/85">
              Students walk away equipped with practical life skills,
              relationship wisdom, emotional intelligence, communication tools,
              healing strategies, leadership principles, and transformational
              knowledge applicable to everyday life.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/academy/checkout?course=module-6"
                className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Pay & Enroll
              </a>

              <a
                href="/about/academy/module-7"
                className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
              >
                Continue To Module 7
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
