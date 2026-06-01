"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function MentorshipCoachingPage() {
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
                Mentoring & Coaching
              </p>

              <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
                Guidance for Real-Life Challenges and Growth
              </h1>

              <p className="mt-8 text-xl leading-10 text-white/85">
                Life comes with questions, transitions, pressures, emotional
                struggles, and personal battles that often require guidance,
                support, and wisdom.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/80">
                Our Mentoring & Coaching sessions provide a safe and
                confidential space where individuals can seek direction,
                healing, accountability, and personal development.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/counselling/book?service=mentorship-coaching"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Book Mentorship Session
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
                  src="/coaching.png"
                  alt="Mentoring and Coaching"
                  className="max-h-[760px] w-full rounded-[2.5rem] object-contain"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-28">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Counselling & Mentorship Programs at DMs
            </p>

            <h2 className="mt-6 font-serif text-6xl font-black leading-none">
              Biblical Principles. Practical Wisdom. Lasting Transformation.
            </h2>

            <div className="mt-10 space-y-8 text-xl leading-10 text-white/85">
              <p>
                At Delly’s Matchups, we believe that healthy relationships,
                purposeful living, emotional healing, and successful marriages
                are built intentionally ; not accidentally.
              </p>

              <p>
                Our counselling and mentorship sessions are designed to provide
                guidance, clarity, healing, restoration, growth, and
                transformation through a balanced approach that combines
                Biblical principles, emotional intelligence, practical life
                wisdom, honest conversations, and personalized mentorship.
              </p>

              <p>
                We understand that every individual, relationship, and marriage
                is unique. Therefore, our sessions are tailored to address
                real-life situations with empathy, wisdom, confidentiality, and
                practical solutions.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-6xl font-black leading-none">
              Areas Covered Under Mentoring & Coaching
            </h2>

            <div className="mt-16 grid gap-8 md:grid-cols-2">
              <div className="rounded-[2.5rem] bg-[#c1121f] p-10 shadow-2xl">
                <h3 className="font-serif text-4xl font-black">
                  General Counselling
                </h3>

                <p className="mt-6 text-xl leading-10 text-white/85">
                  Support and guidance for emotional struggles, relationship
                  issues, family concerns, anxiety and confusion, life
                  transitions, and personal growth.
                </p>
              </div>

              <div className="rounded-[2.5rem] bg-[#c1121f] p-10 shadow-2xl">
                <h3 className="font-serif text-4xl font-black">
                  Virginity 101
                </h3>

                <p className="mt-6 text-xl leading-10 text-white/85">
                  Biblical and practical conversations around purity and
                  self-respect, boundaries, sexual discipline, emotional
                  wisdom, healthy relationship choices, and preserving personal
                  values in modern society.
                </p>
              </div>

              <div className="rounded-[2.5rem] bg-[#c1121f] p-10 shadow-2xl">
                <h3 className="font-serif text-4xl font-black">
                  Personal Development
                </h3>

                <p className="mt-6 text-xl leading-10 text-white/85">
                  Confidence building, discipline and consistency,
                  communication skills, emotional intelligence, leadership
                  growth, and becoming the best version of yourself.
                </p>
              </div>

              <div className="rounded-[2.5rem] bg-[#c1121f] p-10 shadow-2xl">
                <h3 className="font-serif text-4xl font-black">
                  Issues of Life
                </h3>

                <p className="mt-6 text-xl leading-10 text-white/85">
                  Practical discussions and guidance concerning identity
                  struggles, heartbreak and healing, peer pressure, purpose and
                  direction, family conflicts, self-esteem, emotional pain, and
                  navigating life responsibly.
                </p>
              </div>

              <div className="rounded-[2.5rem] bg-[#c1121f] p-10 shadow-2xl md:col-span-2">
                <h3 className="font-serif text-4xl font-black">
                  Mentorship and Accountability
                </h3>

                <p className="mt-6 text-xl leading-10 text-white/85">
                  One-on-one mentoring, personal growth tracking,
                  encouragement and accountability, goal setting, and
                  transformation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-28">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16">
            <h2 className="font-serif text-5xl font-black leading-none">
              Our Counselling Approach
            </h2>

            <p className="mt-8 text-xl leading-10 text-white/85">
              At DMs, our counselling and mentorship approach is built on
              confidentiality, empathy, respect, non-judgment, Biblical
              wisdom, practical solutions, and genuine care for people.
            </p>

            <p className="mt-10 text-xl leading-10 text-white/85">
              We believe healing and transformation are possible when
              individuals are given the right guidance, support, and
              environment to grow.
            </p>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16">
            <h2 className="font-serif text-5xl font-black leading-none">
              Why Choose DMs Counselling?
            </h2>

            <p className="mt-8 text-xl leading-10 text-white/85">
              At DMs, we do not merely offer conversations ; we offer
              transformational guidance.
            </p>

            <p className="mt-8 text-xl leading-10 text-white/85">
              Our sessions are honest and practical, spiritually grounded,
              emotionally intelligent, confidential and respectful, and focused
              on lasting growth and healing.
            </p>

            <p className="mt-10 text-xl leading-10 text-white/85">
              We are passionate about helping individuals, couples, and
              families thrive emotionally, spiritually, mentally, and
              relationally.
            </p>
          </div>
        </section>

        <section className="px-6 pb-32 pt-28">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-white p-10 text-[#b30018] shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em]">
              Begin Your Journey
            </p>

            <h2 className="mt-6 font-serif text-6xl font-black leading-none">
              Healing begins with one conversation. Growth begins with one
              decision.
            </h2>

            <div className="mt-10 space-y-8 text-xl leading-10 text-black/70">
              <p>
                Whether you are preparing for marriage, navigating marital
                challenges, seeking clarity and purpose, healing emotionally,
                or simply looking for mentorship and guidance, DMs is here to
                walk the journey with you.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-5">
              <a
                href="/counselling/book?service=mentorship-coaching"
                className="rounded-full bg-[#b30018] px-10 py-5 text-lg font-black text-white transition hover:scale-105"
              >
                Book A Session
              </a>

              <a
                href="/contact"
                className="rounded-full border border-[#b30018]/20 px-10 py-5 text-lg font-black transition hover:bg-[#b30018] hover:text-white"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
