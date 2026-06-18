"use client";

import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function MatchupsPage() {
  return (
    <>
      <SiteNav />

      <main className="overflow-hidden bg-[#b30018] text-white">

        {/* HERO */}

        <section className="px-6 pb-24 pt-44">

          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">

            <motion.div
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >

              <p className="text-sm font-black uppercase tracking-[0.4em] text-red-100">
                Delly's Matchups
              </p>

              <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">

                Meaningful

                <span className="mt-3 block">
                  Connections
                </span>

                <span className="mt-3 block text-red-200">
                  Start Here
                </span>

              </h1>

              <p className="mt-10 max-w-2xl text-xl text-white/80">

                Build intentional, authentic and God-centred relationships.

              </p>

              <div className="mt-12 flex flex-wrap gap-5">

                <a
                  href="/auth/signup"
                  className="rounded-full bg-white px-10 py-5 font-black text-[#b30018]"
                >
                  Join Free
                </a>

                <a
                  href="/#matchups"
                  className="rounded-full border border-white/20 px-10 py-5 font-black"
                >
                  Explore Plans
                </a>

              </div>

            </motion.div>

            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="overflow-hidden rounded-[3rem] shadow-2xl"
            >

              <img
                src="/matchups-hero.png"
                alt="Delly's Matchups"
                className="h-[650px] w-full object-cover"
              />

            </motion.div>

          </div>

        </section>
{/* HOW MATCHUPS WORK */}

<section className="px-6 py-24">

<div className="mx-auto max-w-7xl">

  <div className="text-center">

    <p className="font-black uppercase tracking-[0.35em] text-red-100">
      How Matchups Works
    </p>

    <h2 className="font-display mt-6 text-6xl font-bold">
      Simple. Intentional. Authentic.
    </h2>

  </div>

  <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

    {[
      "Create Your Profile",

      "Tell Us Your Preferences",

      "Discover Compatible Matches",

      "Connect Safely",

      "Build Authentic Relationships",

      "Grow Together",

    ].map((item, index) => (

      <motion.div
        key={item}
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="rounded-[2.5rem] bg-white p-10 text-[#b30018] shadow-2xl"
      >

        <p className="text-5xl font-black">

          0{index + 1}

        </p>

        <h3 className="mt-8 text-3xl font-black">

          {item}

        </h3>

      </motion.div>

    ))}

  </div>

</div>

</section>



{/* WHO IS MATCHUPS FOR */}

<section className="px-6 py-24">

<div className="mx-auto max-w-7xl">

  <div className="text-center">

    <p className="font-black uppercase tracking-[0.35em] text-red-100">
      Who Is Matchups For?
    </p>

    <h2 className="font-display mt-6 text-6xl font-bold">

      Built For Everyone

    </h2>

  </div>

  <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

    {[
      "Singles",

      "Professionals",

      "Christians",

      "Widows & Widowers",

      "Divorced Individuals",

      "Africa & The Diaspora",

    ].map((item) => (

      <motion.div

        key={item}

        initial={{ y: 50, opacity: 0 }}

        whileInView={{ y: 0, opacity: 1 }}

        viewport={{ once: true }}

        className="rounded-[2.5rem] border border-white/10 bg-white/10 p-10 text-center backdrop-blur-xl"

      >

        <p className="text-3xl font-black">

          {item}

        </p>

      </motion.div>

    ))}

  </div>

</div>

</section>
{/* FINAL CTA */}

<section className="px-6 py-28">

<div className="mx-auto max-w-6xl">

  <motion.div

    initial={{ y: 60, opacity: 0 }}

    whileInView={{ y: 0, opacity: 1 }}

    viewport={{ once: true }}

    className="rounded-[3rem] bg-white p-12 text-center text-[#b30018] shadow-2xl md:p-20"

  >

    <p className="text-sm font-black uppercase tracking-[0.35em]">

      Begin Your Journey

    </p>

    <h2 className="font-display mt-6 text-5xl font-bold leading-none md:text-7xl">

      Ready To Begin?

    </h2>

    <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-black/70">

      Join a growing global community committed to authentic, intentional and God-centred relationships.

    </p>

    <div className="mt-14 flex flex-wrap justify-center gap-5">

      <a

        href="/auth/signup"

        className="rounded-full bg-[#b30018] px-10 py-5 font-black text-white transition hover:scale-105"

      >

        Join Free Today

      </a>

      <a

        href="/#matchups"

        className="rounded-full border border-[#b30018]/20 px-10 py-5 font-black transition hover:bg-[#b30018] hover:text-white"

      >

        Explore Plans

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
