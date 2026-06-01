"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function ModuleFivePage() {
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
              src="/gallery2.jpg"
              alt="Healing & Restoration Clinic"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/65" />

            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-40">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="max-w-5xl"
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-200">
                Module 5
              </p>

              <h1 className="font-display mt-8 text-7xl font-bold leading-[0.9] lg:text-9xl">
                Healing & Restoration Clinic
              </h1>

              <p className="mt-8 max-w-4xl text-2xl font-bold text-[#ffccd5]">
                Emotional Recovery & Personal Healing
              </p>

              <p className="mt-8 max-w-4xl text-xl leading-10 text-white/80">
                A transformational healing program designed to help individuals
                recover emotionally, rebuild self-worth, process pain, let go of
                past wounds, and step into wholeness, clarity, and purposeful
                living.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/auth/signup"
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
                Restoring emotional strength, identity and inner wholeness.
              </h2>

              <p className="mt-8 text-lg leading-9 text-black/70">
                The Healing & Restoration Clinic focuses on helping students
                understand emotional pain, heartbreak, trauma, self-esteem
                struggles, forgiveness, recovery, and restoration.
              </p>

              <p className="mt-6 text-lg leading-9 text-black/70">
                This module provides practical tools for emotional recovery,
                healthy processing, self-worth restoration, and personal healing
                so individuals can grow beyond pain and live with clarity,
                strength, and purpose.
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
                src="/gallery3.jpg"
                alt="Healing and Restoration"
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
                Emotional recovery and restoration processes.
              </h2>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Healing from Heartbreak",
                "Trauma Recovery",
                "Self-Esteem Restoration",
                "Forgiveness & Letting Go",
                "Emotional Recovery Processes",
              ].map((topic, index) => (
                <motion.div
                  key={topic}
                  initial={{ y: 60, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
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
              Healing Journey
            </p>

            <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
              From pain to clarity, confidence and restoration.
            </h2>

            <p className="mt-8 max-w-5xl text-lg leading-9 text-black/70">
              Students are guided through emotional recovery principles that
              help them understand pain, rebuild confidence, restore personal
              dignity, develop healthier emotional patterns, and embrace a
              renewed sense of identity and purpose.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                "Emotional clarity",
                "Healthy self-worth",
                "Restored confidence",
                "Purposeful healing",
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
              Heal, rebuild and move forward with purpose.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-10 text-white/85">
              Students gain emotional strength, self-awareness, healing tools,
              confidence, and practical wisdom for moving beyond heartbreak,
              trauma, low self-esteem, and emotional pain into restoration and
              purposeful living.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/auth/signup"
                className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Pay & Enroll
              </a>

              <a
                href="/about/academy/module-6"
                className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
              >
                Continue To Module 6
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
