"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const modules = [
  {
    title: "Counselling 101",
    description:
      "Foundational relationship and life counselling principles for beginners.",
    link: "/about/academy/module-1",
    image: "/thumbnail.png",
  },
  {
    title: "Counselling 102",
    description:
      "Advanced relationship and emotional counselling techniques.",
    link: "/about/academy/module-2",
    image: "/thumbnail.png",
  },
  {
    title: "Counselling 103",
    description:
      "Becoming a seasoned transformational counsellor and mentor.",
    link: "/about/academy/module-3",
    image: "/thumbnail.png",
  },
  {
    title: "Leadership & Influence",
    description:
      "Building confidence, public speaking and transformational leadership.",
    link: "/about/academy/module-4",
    image: "/thumbnail.png",
  },
  {
    title: "Healing & Restoration",
    description:
      "Emotional recovery, healing and restoration mentorship.",
    link: "/about/academy/module-5",
    image: "/thumbnail.png",
  },
  {
    title: "Master Classes",
    description:
      "Specialized trainings on relationships, healing, mentorship and family.",
    link: "/about/academy/module-6",
    image: "/thumbnail.png",
  },
  {
    title: "Virginity 101",
    description:
      "Purity, self-worth, emotional intelligence and intentional living.",
    link: "/about/academy/module-7",
    image: "/thumbnail.png",
  },
];

export default function AcademyPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

        html {
          scroll-behavior: smooth;
        }

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
        <section className="relative min-h-[110vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/academy1.jpg"
              alt="Delly's Mentoring Academy"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/60" />

            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[110vh] max-w-7xl items-center px-6 pt-40">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="max-w-5xl"
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-200">
                Delly’s Mentoring Academy
              </p>

              <h1 className="font-display mt-8 text-6xl font-bold leading-[0.9] text-white lg:text-9xl">
                Raising Purposeful Leaders,
                <span className="block text-[#ffccd5]">
                  Counsellors &
                </span>
                Transformational Voices
              </h1>

              <p className="mt-10 max-w-4xl text-xl leading-10 text-white/80">
                A transformational mentorship and learning platform designed to
                equip emotionally healthy, purpose-driven and impactful
                individuals through practical wisdom, Biblical principles,
                leadership and counselling training.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                 href="/academy/checkout?course=full-academy"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Join The Academy
                </a>

                <a
                  href="#modules"
                  className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                >
                  Explore Modules
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
                Our Vision
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Raising a generation of transformational voices.
              </h2>

              <p className="mt-8 text-lg leading-9 text-black/70">
                Delly’s Mentoring Academy was created to nurture individuals who
                desire growth beyond ordinary living.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  "Purposeful leaders",
                  "Emotionally healthy individuals",
                  "Transformational mentors",
                  "Skilled counsellors",
                  "Confident communicators",
                  "Healthy relationship builders",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.8rem] border border-black/10 bg-white p-5 shadow-lg"
                  >
                    <p className="font-bold text-[#b30018]">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] border border-black/10 bg-white p-4 shadow-2xl"
            >
              <img
                src="/academy10.jpg"
                alt="Academy Vision"
                className="h-[750px] w-full rounded-[2.5rem] object-cover"
              />
            </motion.div>
          </div>
        </section>

        <section
          id="modules"
          className="bg-[#080304] px-6 py-32 text-white"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <p className="font-bold uppercase tracking-[0.35em] text-red-200">
                Academy Modules
              </p>

              <h2 className="font-display mt-5 text-6xl font-bold leading-none lg:text-7xl">
                Structured transformational training.
              </h2>

              <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-white/70">
                Explore our mentorship and counselling programs carefully
                designed to build healthy individuals, leaders, mentors,
                counsellors and transformational voices.
              </p>
            </motion.div>

            <div className="mt-20 grid gap-8 lg:grid-cols-2">
              {modules.map((module, index) => (
                <motion.div
                  key={module.title}
                  initial={{ y: 70, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl"
                >
                  <img
                    src={module.image}
                    alt={module.title}
                    className="h-[320px] w-full object-cover"
                  />

                  <div className="p-8">
                    <p className="text-sm font-black uppercase tracking-[0.35em] text-red-200">
                      Module {index + 1}
                    </p>

                    <h3 className="font-display mt-4 text-5xl font-bold">
                      {module.title}
                    </h3>

                    <p className="mt-6 text-lg leading-8 text-white/75">
                      {module.description}
                    </p>

                    <a
                      href={module.link}
                      className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
                    >
                      Explore Module
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-32">
          <div className="absolute inset-0">
            <img
              src="/academy4.jpg"
              alt="Join The Academy"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/70" />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-200">
                Start Your Transformation Journey
              </p>

              <h2 className="font-display mt-8 text-6xl font-bold leading-[0.95] text-white lg:text-8xl">
                Learn.
                <span className="block text-[#ffccd5]">
                  Heal. Grow. Lead.
                </span>
              </h2>

              <p className="mx-auto mt-10 max-w-4xl text-xl leading-10 text-white/80">
                Whether you desire emotional healing, leadership growth,
                counselling skills, mentorship training or purpose discovery,
                Delly’s Mentoring Academy is designed for your transformation.
              </p>

              <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
                <a
                  href="/academy/checkout?course=full-academy"
                  className="rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
                >
                  Join The Academy
                </a>

                <a
                  href="/contact"
                  className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                >
                  Contact Us
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
