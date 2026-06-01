"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const programs = [
  {
    title: "Premarital Counselling",
    subtitle: "Building the Right Foundation Before “I Do”",
    href: "/counselling/premarital",
    points: [
      "Purpose of marriage",
      "Self-discovery and identity",
      "Compatibility assessment",
      "Communication and conflict resolution",
      "Marriage expectations and reality",
      "Intimacy and boundaries",
    ],
  },
  {
    title: "Marital Counselling",
    subtitle: "Healing, Restoration, and Rekindling Love",
    href: "/counselling/marital",
    points: [
      "Conflict resolution",
      "Communication breakdown",
      "Emotional healing",
      "Rekindling love and connection",
      "Family and parenting challenges",
      "Financial and lifestyle issues",
    ],
  },
  {
    title: "Purpose Discovery",
    subtitle: "Discovering Why You Exist",
    href: "/counselling/relationship",
    points: [
      "Self-discovery",
      "Vision and direction",
      "Confidence and mindset building",
      "Leadership and personal growth",
      "Healing and emotional awareness",
    ],
  },
  {
    title: "Mentoring & Coaching",
    subtitle: "Guidance for Real-Life Challenges and Growth",
    href: "/counselling/coaching",
    points: [
      "General counselling",
      "Virginity 101",
      "Personal development",
      "Issues of life",
      "Mentorship and accountability",
    ],
  },
];

export default function CounsellingPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

        body {
          margin: 0;
          background: #b30018;
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        .font-display {
          font-family: "Cormorant Garamond", serif;
        }
      `}</style>

      <SiteNav />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
  <img
    src="/hero.jpg"
    alt="Counselling"
    className="absolute inset-0 h-full w-full object-cover"
  />

  <div className="absolute inset-0 bg-black/60" />

  <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
    <p className="text-sm font-black uppercase tracking-[0.4em] text-red-200">
      DMs Counselling
    </p>

    <h1 className="mt-6 text-6xl font-black leading-tight">
      Heal. Grow. Build Better Relationships.
    </h1>

    <p className="mt-6 text-xl leading-8 text-white/80">
      Professional counselling and mentorship designed to help individuals,
      couples, and families move forward with clarity and confidence.
    </p>

    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
      <a
        href="/counselling/book"
        className="rounded-full bg-white px-8 py-4 font-bold text-[#b30018]"
      >
        Book A Session
      </a>

      <a
        href="#services"
        className="rounded-full border border-white/30 px-8 py-4 font-bold text-white"
      >
        Explore Services
      </a>
    </div>
  </div>
</section>

      <main className="bg-[#b30018] text-white">
        <section className="px-6 pb-28 pt-44">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-5xl"
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Counselling & Mentorship Programs
              </p>

              <h1 className="font-display mt-6 text-7xl font-bold leading-none md:text-8xl">
                Biblical Principles.
                <span className="block text-red-100">
                  Practical Wisdom.
                </span>
                Lasting Transformation.
              </h1>

              <p className="mt-10 max-w-4xl text-xl leading-10 text-white/80">
                At Delly’s Matchups, we believe healthy relationships,
                purposeful living, emotional healing, and successful marriages
                are built intentionally — not accidentally.
              </p>

              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[
                  "Biblical principles",
                  "Emotional intelligence",
                  "Practical life wisdom",
                  "Honest conversations",
                  "Personalized mentorship",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] bg-[#c1121f] p-5 text-center font-bold shadow-xl"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
            {programs.map((program, index) => (
              <motion.article
                key={program.title}
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
              >
                <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h2 className="font-display mt-5 text-5xl font-bold leading-none">
                  {program.title}
                </h2>

                <p className="mt-4 text-xl font-bold text-red-100">
                  {program.subtitle}
                </p>

                <div className="mt-8 grid gap-4">
                  {program.points.map((point) => (
                    <div
                      key={point}
                      className="rounded-[1.5rem] bg-white/10 p-5 font-bold"
                    >
                      {point}
                    </div>
                  ))}
                </div>

                <a
                  href={program.href}
                  className="mt-10 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
                >
                  Learn More
                </a>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <div className="rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-14">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                Our Counselling Approach
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none">
                Safe, wise, confidential guidance.
              </h2>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  "Confidentiality",
                  "Empathy",
                  "Respect",
                  "Non-judgment",
                  "Biblical wisdom",
                  "Practical solutions",
                  "Genuine care",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.5rem] bg-white/10 p-5 font-bold"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[3rem] bg-white p-10 text-[#b30018] shadow-2xl md:p-14">
              <p className="text-sm font-black uppercase tracking-[0.35em]">
                Why Choose DMs?
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none">
                More than conversations.
              </h2>

              <p className="mt-8 text-lg leading-9 text-black/70">
                At DMs, we do not merely offer conversations — we offer
                transformational guidance that is honest, practical, spiritually
                grounded, emotionally intelligent, confidential, respectful, and
                focused on lasting growth and healing.
              </p>

              <a
                href="/counselling/book"
                className="mt-10 inline-flex rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
              >
                Book A Session
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto max-w-6xl rounded-[3rem] bg-[#c1121f] p-10 text-center shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Begin Your Journey
            </p>

            <h2 className="font-display mt-6 text-6xl font-bold leading-none md:text-7xl">
              Healing begins with one conversation.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-white/80">
              Whether you are preparing for marriage, navigating marital
              challenges, seeking clarity and purpose, healing emotionally, or
              looking for mentorship and guidance, DMs is here to walk the
              journey with you.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <a
                href="/counselling/book"
                className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
              >
                Book Counselling
              </a>

              <a
                href="/about/academy"
                className="rounded-full border border-white/20 px-10 py-5 text-lg font-black transition hover:bg-white/10"
              >
                Explore Academy
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
