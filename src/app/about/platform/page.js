"use client";

import {SiteNav, SiteFooter} from "@/app/components/SiteChrome";
import { motion } from "framer-motion";

export default function AboutPlatformPage() {
  return (
    <>
    <style jsx global>{`
  @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap");

  html {
    scroll-behavior: smooth;
  }

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

      <main className="overflow-hidden bg-white text-[#111]">
        <section className="relative flex min-h-[115vh] items-start overflow-hidden pt-[115px]">
          <div className="absolute inset-0 right-0 top-0 bottom-0">
            <img
              src="/about-platform.jpg"
              alt="Delly's Matchups"
              className="h-full w-full object-cover object-[center_50%]"
            />

            <div className="absolute inset-0 bg-black/50 object-cover object-center h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-start px-6 pt-48">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="max-w-4xl"
            >
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.45em] text-red-200">
                About Delly’s Matchups
              </p>

              <h1 className="font-display text-7xl font-bold leading-[0.9] text-white lg:text-9xl">
                Redefining
                <span className="block text-red-400">
                  Authentic Relationships
                </span>
              </h1>

              <p className="mt-10 max-w-3xl text-xl leading-9 text-white/80">
                A global faith-based matchmaking, counselling and mentorship
                platform helping individuals build intentional, healthy and
                authentic relationships rooted in Biblical principles.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative bg-white px-6 py-32">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-[3rem] border border-black/10 bg-[#fffaf8] p-10 shadow-[0_30px_90px_rgba(0,0,0,0.08)] lg:p-20"
            >
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b30018]">
                Welcome to DMs
              </p>

              <h2 className="font-display mt-6 text-5xl font-bold leading-none text-black lg:text-7xl">
                Welcome to Delly’s Matchups
              </h2>

              <div className="mt-12 space-y-10 text-lg leading-9 text-black/75">
                <p>
                  Welcome to Delly’s Matchups — a relationship and matchmaking
                  platform founded on Biblical principles with the mission of
                  “Redefining Authentic Relationships.”
                </p>

                <p>
                  What began as simple relationship conversations on social
                  media has today evolved into a growing global community
                  dedicated to building meaningful, healthy, and God-centered
                  relationships and marriages.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative bg-[#fff5f2] px-6 py-32">
          <div className="mx-auto grid max-w-7xl items-start gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ x: -80, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="sticky top-40 space-y-10">
             <div className ="h-fit overflow-hidden rounded-[3rem] shadow-2xl">
                <img
                  src="/gallery5.jpg"
                  alt="About Delly's Matchups"
                  className="h-full min-h-[650px] w-full object-cover object-center"
                />
                </div>

             <div className= "h-fit overflow-hidden rounded-[3rem] shadow-2xl">
                <img
                  src="/academy4.jpg"
                  alt="About Delly's Matchups"
                  className="h-full min-h-[650px] w-full object-cover object-center"
                />

</div>
</div>


            </motion.div>

            <motion.div
              initial={{ x: 80, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-[3rem] border border-black/10 bg-white p-10 shadow-[0_25px_80px_rgba(0,0,0,0.08)]"
            >
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b30018]">
                Our Story
              </p>

              <h2 className="font-display mt-6 text-5xl font-bold leading-none lg:text-6xl">
                How It All Began
              </h2>

              <div className="mt-10 space-y-8 text-lg leading-9 text-black/75">
                <p>
                  Delly’s Matchups (DMs) was founded in 2015 through the
                  life-changing impact of relationship and marriage teachings
                  shared by Delly Singah on Facebook.
                </p>

                <p>
                  With wisdom, compassion, and authenticity, Delly selflessly
                  taught on relationships, love, healing, marriage, and
                  personal growth based on Biblical principles.
                </p>

                <p>
                  What started as ordinary discussions quickly became a safe
                  haven for thousands of people seeking guidance, clarity,
                  healing, and direction in their personal lives.
                </p>

                <p>
                  Over time, followers began reaching out privately with deeply
                  personal struggles and emotional burdens, often saying:
                </p>

                <div className="rounded-[2rem] bg-[#b30018] p-8 text-center text-white shadow-2xl">
                  <p className="font-display text-4xl italic leading-relaxed">
                    “Mummy Delly, please hide my ID and counsel me…”
                  </p>
                </div>

                <p>
                  These heartfelt cries for help became the foundation of a
                  movement that would later touch countless lives around the
                  world.
                </p>

                <p>
                  As the community continued to grow, one thing became evident —
                  many young people were not only searching for advice but were
                  also genuinely looking for meaningful relationships and life
                  partners grounded in shared values.
                </p>

                <p>
                  This inspired the birth of Matchups.
                </p>

                <p>
                  Initially, DMs manually created and managed profiles for
                  singles interested in being matched.
                </p>

                <p>
                  What began with a handful of people soon grew into thousands
                  of participants across different countries and continents.
                </p>

                <p>
                  Today, many successful relationships and happy marriages have
                  been born from the DMs platform, and countless testimonies
                  continue to emerge from individuals whose lives were
                  transformed through counseling, mentorship, and meaningful
                  connections.
                </p>

                <p>
                  As the community expanded beyond what could be managed
                  manually, the vision evolved into creating a dedicated digital
                  platform — a safe and structured space capable of
                  accommodating people globally while maintaining the values and
                  integrity upon which DMs was founded.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-black px-6 py-32 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-[3rem] border border-white/10 bg-white/5 p-12 backdrop-blur-xl"
            >
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-300">
                Our Mission
              </p>

              <h2 className="font-display mt-6 text-6xl font-bold">
                What Drives Us
              </h2>

              <ul className="mt-10 space-y-6 text-lg leading-8 text-white/80">
                <li>
                  • To build thriving relationships founded on godly values;
                </li>

                <li>
                  • To encourage healthy, intentional, and authentic marriages;
                </li>

                <li>
                  • To restore dignity, respect, and purpose in modern
                  relationships;
                </li>

                <li>
                  • To provide counseling, mentorship, and support for singles,
                  couples, and families;
                </li>

                <li>
                  • To create a safe and meaningful platform where genuine
                  connections can flourish.
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ y: 70, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#7a0012] via-[#b30018] to-[#4a0008] p-12"
            >
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-200">
                Our Vision
              </p>

              <h2 className="font-display mt-6 text-6xl font-bold text-white">
                Looking Ahead
              </h2>

              <div className="mt-10 space-y-8 text-lg leading-9 text-white/85">
                <p>
                  In a world where relationship standards continue to shift,
                  DMs seeks to challenge unhealthy narratives and redefine what
                  authentic relationships truly mean.
                </p>

                <p>
                  Our vision is to become one of the leading faith-based
                  relationship and matchmaking communities in:
                </p>

                <ul className="space-y-4 text-xl font-bold">
                  <li>• Cameroon</li>
                  <li>• Africa</li>
                  <li>• Across the globe</li>
                </ul>

                <p>
                  We envision a generation of individuals and couples who
                  pursue love, marriage, and family life with wisdom,
                  integrity, commitment, and purpose.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-white px-6 py-32">
          <div className="mx-auto max-w-6xl rounded-[3rem] border border-black/10 bg-[#fff8f5] p-12 shadow-[0_25px_80px_rgba(0,0,0,0.08)] lg:p-20">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b30018]">
              More Than Matchmaking
            </p>

            <h2 className="font-display mt-6 text-6xl font-bold leading-none text-black">
              Building Relationships That Thrive
            </h2>

            <div className="mt-12 space-y-8 text-lg leading-9 text-black/75">
              <p>
                At DMs, we believe relationships should not merely begin — they
                should thrive.
              </p>

              <p>Beyond matchmaking, we are passionate about:</p>

              <div className="grid gap-5 md:grid-cols-2">
                {[
                  "Relationship counseling",
                  "Marriage mentorship",
                  "Conflict resolution",
                  "Emotional healing",
                  "Faith-centered guidance",
                  "Personal development",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg"
                  >
                    <p className="text-xl font-bold text-[#b30018]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <p>
                Our goal is not only to connect people but also to help them
                build healthy, lasting, and fulfilling relationships.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#111] px-6 py-32 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[3rem] border border-white/10 bg-white/5 p-12 backdrop-blur-xl lg:p-20">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-300">
                Counseling at DMs
              </p>

              <h2 className="font-display mt-6 text-6xl font-bold leading-none">
                Guidance, Healing & Restoration
              </h2>

              <div className="mt-12 space-y-8 text-lg leading-9 text-white/80">
                <p>
                  Counseling has always been at the heart of DMs.
                </p>

                <p>
                  Over the years, thousands of individuals have trusted us with
                  their personal journeys, relationship struggles, emotional
                  pain, and marital concerns.
                </p>

                <p>
                  Through Biblical wisdom, practical guidance, empathy, and
                  confidentiality, DMs has become a trusted voice for many
                  navigating love, dating, marriage, and family life.
                </p>

                <p>Our counseling approach emphasizes:</p>

                <div className="grid gap-5 md:grid-cols-2">
                  {[
                    "Biblical principles",
                    "Emotional intelligence",
                    "Respect and accountability",
                    "Healing and restoration",
                    "Healthy communication",
                    "Intentional relationship building",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[2rem] border border-white/10 bg-black/40 p-6"
                    >
                      <p className="text-xl font-bold text-red-200">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <p>
                  We believe every individual deserves guidance, hope, and the
                  opportunity to experience healthy love.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#b30018] via-[#8a0012] to-[#3d0007] px-6 py-32 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-100">
              Join The Movement
            </p>

            <h2 className="font-display mt-6 text-7xl font-bold leading-none">
              A Global Community
            </h2>

            <div className="mx-auto mt-12 max-w-5xl space-y-8 text-xl leading-10 text-white/85">
              <p>
                DMs has built a vibrant and growing online presence across
                multiple social media platforms including Facebook, Instagram,
                X (Twitter), and TikTok.
              </p>

              <p>
                Collectively, our platforms reach over one million followers
                globally, creating a diverse and engaged community passionate
                about meaningful relationships and marriage conversations.
              </p>

              <p>
                As part of our growing vision, DMs plans to launch
                international relationship seminars, marriage conferences,
                counseling workshops, global speaking tours, and transformational
                relationship events around the world.
              </p>

              <p>
                Whether you are single, dating, preparing for marriage, or
                seeking guidance in your relationship journey, DMs is here to
                support you.
              </p>

              <p>
                Join a growing global community committed to love, purpose,
                healing, authenticity, and godly values.
              </p>
            </div>

            <a
              href="/auth/signup"
              className="mt-16 inline-flex rounded-full bg-white px-10 py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
            >
              Sign Up Today & Get Matched-Up Now
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
