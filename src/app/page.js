"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { SiteNav } from "@/app/components/SiteChrome";

const testimonials = [
  {
    name: "Michelle",
    text: "DMs helped me heal emotionally and prepare for a healthy relationship.",
  },
  {
    name: "Daniel",
    text: "I met my fiancée through Delly’s Matchups. Forever grateful.",
  },
  {
    name: "Priscilla",
    text: "The counselling sessions completely changed my mindset about love.",
  },
];

const gallery = ["/gallery1.jpg", "/gallery2.jpg", "/gallery3.jpg", "/gallery4.jpg"];

const plans = [
  {
    name: "Free",
    price: "$0",
    features: [
      "Create account",
      "Basic profile",
      "Upload 1 photo",
      "Browse members",
      "Like profiles",
      "Receive notifications",
    ],
    missing: [
      "Direct messaging",
      "See who liked you",
      "View full profiles",
      "Upload more photos",
      "Connect with members",
      "VIP access",
    ],
  },
  {
    name: "Premium",
    price: "$20",
    image: "/premium-banner.png",
    featured: true,
    features: [
      "Upload up to 5 photos",
      "Direct messaging",
      "View full profiles",
      "See who liked you",
      "Connect with members",
      "Priority visibility",
    ],
  },
  {
    name: "VIP",
    price: "$100",
    image: "/vip-banner.png",
    features: [
      "Everything in Premium",
      "Unlimited photos",
      "VIP badge",
      "Priority support",
      "Private counselling",
      "Free Delly Singah book",
    ],
  },
];

const petals = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 11) % 100}%`,
  delay: index * 0.35,
  duration: 12 + (index % 7),
  scale: 0.7 + (index % 5) * 0.12,
}));

function Petals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute"
          style={{ left: petal.left }}
          initial={{ y: -100, rotate: 0, opacity: 0, scale: petal.scale }}
          animate={{ y: 1400, rotate: 720, opacity: [0, 0.9, 0] }}
          transition={{
            duration: petal.duration,
            repeat: Infinity,
            delay: petal.delay,
            ease: "linear",
          }}
        >
          <div className="relative h-6 w-6">
            <div className="absolute h-6 w-4 rotate-45 rounded-b-full rounded-t-full bg-red-200/70 blur-[1px]" />
            <div className="absolute left-2 h-6 w-4 -rotate-45 rounded-b-full rounded-t-full bg-red-300/70 blur-[1px]" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  async function handleCheckout(plan) {
    if (plan === "free") {
      window.location.href = "/auth/signup";
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const response = await fetch("/api/paypal/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan,
        userId: user.id,
        email: user.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to start checkout.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#b30018] text-white">
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
      <Petals />

      <div className="relative z-30 mt-32 mb-4 w-full overflow-hidden border-y border-yellow-300/30 bg-black/50 py-3 text-white">
        <motion.div
          className="flex w-max whitespace-nowrap"
          animate={{ x: [0, -2000] }}
          transition={{
            repeat: Infinity,
            duration: 21,
            ease: "linear",
          }}
        >
          {[1, 2].map((item) => (
            <div
              key={item}
              className="flex items-center gap-12 pr-12 text-sm font-black uppercase tracking-[0.3em]"
            >
              <span className="text-yellow-300">★ Advertise With Us</span>
              <span>Promote Your Brand</span>
              <span>Reach Africa & The Diaspora</span>
              <span>Sponsor Events</span>
              <span>Partner With Delly&apos;s Matchups</span>
            </div>
          ))}
        </motion.div>
      </div>

      <section className="relative -mt-10 px-6 pt-0">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ x: -70, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-7xl font-bold leading-[0.9] tracking-tight lg:text-9xl">
              Find your
              <span className="block text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.6)]">
                perfect match.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/80">
              Delly’s Matchups is a global faith-based matchmaking, counselling
              and mentorship platform helping individuals build intentional,
              healthy and authentic relationships rooted in Biblical principles.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <a
                href="/auth/signup"
                className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] shadow-2xl transition hover:scale-105"
              >
                Join Free
              </a>

              <a
                href="#video"
                className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black backdrop-blur-xl transition hover:bg-white/20"
              >
                Watch Intro
              </a>
            </div>

            <div className="mt-14 flex flex-wrap gap-8 text-sm font-bold text-white/70">
              <div>
                <p className="text-3xl font-black text-white">1M+</p>
                Community Reach
              </div>

              <div>
                <p className="text-3xl font-black text-white">Global</p>
                Faith-Based Platform
              </div>

              <div>
                <p className="text-3xl font-black text-white">1000+</p>
                Matchups & Testimonies
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 70, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="absolute -inset-5 rounded-[3rem] bg-white/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
              <img
                src="/dellys-logo2.png"
                alt="Delly's Matchups"
                className="mx-auto w-full max-w-2xl object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.35)]"
              />

              <div
                id="video"
                className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-4"
              >
                <div className="flex justify-center">
                  <video
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/dellys-logo2.png"
                    className="aspect-square w-full max-w-[520px] rounded-[1.5rem] object-contain"
                  >
                    <source src="/intro-video.mp4" type="video/mp4" />
                  </video>
                </div>

                <div className="mt-5 text-center">
                  <p className="font-display text-3xl font-bold text-white">
                    Delly Singah
                  </p>

                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-red-200">
                    Founder & CEO of Delly’s Matchups
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="relative mx-auto mt-24 max-w-7xl px-6">
        <motion.div
          initial={{ y: 70, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="font-bold uppercase tracking-[0.35em] text-red-100">
            About DMs
          </p>

          <h2 className="font-display mt-4 text-6xl font-bold leading-none lg:text-7xl">
            One vision. Three pillars.
          </h2>

          <p className="mx-auto mt-6 max-w-4xl text-lg leading-8 text-white/75">
            Delly’s Matchups is more than matchmaking. It is a relationship
            movement built around faith, wisdom, mentorship, healing, and
            authentic love.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 grid items-center gap-10 lg:grid-cols-2"
        >
          <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/10 p-4 shadow-2xl">
            <img
              src="/about-platform.jpg"
              alt="Delly's Matchups"
              className="h-[520px] w-full rounded-[2.5rem] object-cover"
            />
          </div>

          <div className="rounded-[3rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <p className="font-bold uppercase tracking-[0.35em] text-red-100">
              About Delly’s Matchups
            </p>

            <h3 className="font-display mt-4 text-6xl font-bold leading-none">
              The Platform
            </h3>

            <p className="mt-7 text-lg leading-8 text-white/75">
              Delly’s Matchups is a relationship and matchmaking platform
              founded on Biblical principles with the mission of redefining
              authentic relationships.
            </p>

            <p className="mt-5 text-lg leading-8 text-white/75">
              What began as relationship conversations on social media has
              evolved into a growing global community dedicated to building
              meaningful, healthy, and God-centered relationships and marriages.
            </p>

            <a
              href="/about/platform"
              className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto mt-32 max-w-7xl px-6">
        <div className="grid items-center gap-14 rounded-[3rem] bg-white p-10 text-black shadow-2xl lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.3em] text-red-700">
              Featured Book
            </p>

            <h2 className="font-display mt-4 text-6xl font-bold leading-none">
              I DO, I DON’T
            </h2>

            <p className="mt-6 text-lg leading-8 text-black/70">
              Journeying Into Matrimony by Delly Singah. A transformational
              relationship book helping singles and couples navigate love,
              commitment, healing and intentional marriage through wisdom and
              Biblical principles.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/shop/books"
                className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
              >
                Grab A Copy
              </a>

              <a
                href="/shop/books"
                className="rounded-full border border-[#b30018]/20 px-8 py-4 font-black text-[#b30018]"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute inset-0 rounded-full bg-red-200 blur-3xl" />

            <img
              src="/ido-idont-book.jpg"
              alt="I DO I DON'T"
              className="relative z-10 max-w-lg rounded-[2rem] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section id="matchups" className="mx-auto max-w-7xl px-6 py-28">
        <div className="text-center">
          <p className="font-bold uppercase tracking-[0.3em] text-white/70">
            Matchups
          </p>

          <h2 className="font-display mt-4 text-7xl font-bold">
            Choose Your Experience
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/70">
            Whether you are exploring meaningful connections, seeking
            intentional matchmaking or desiring exclusive VIP access, there is a
            plan designed for your journey.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className={`flex min-h-[800px] flex-col overflow-hidden rounded-[2.5rem] border shadow-2xl ${
                plan.name === "VIP"
                  ? "border-yellow-300/60 bg-gradient-to-br from-[#4a0008] via-[#b30018] to-[#d4af37] text-white"
                  : plan.featured
                  ? "border-white/30 bg-white text-[#b30018]"
                  : "border-red-200/20 bg-gradient-to-br from-[#d81432] via-[#b30018] to-[#860010] text-white"
              }`}
            >
              {plan.image && (
                <img
                  src={plan.image}
                  alt={plan.name}
                  className="h-48 w-full object-cover"
                />
              )}

              <div className="flex flex-1 flex-col p-8">
                <h3 className="font-display text-5xl font-bold">
                  {plan.name}
                </h3>

                <p className="mt-4 text-5xl font-black">
                  {plan.price}
                  <span className="text-lg"> / month</span>
                </p>

                {plan.name === "VIP" && (
                  <div className="mt-5 inline-flex w-fit rounded-full bg-yellow-300 px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-black">
                    👑 VIP Elite
                  </div>
                )}

                {plan.name === "Premium" && (
                  <div className="mt-5 inline-flex w-fit rounded-full bg-[#b30018] px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                    ✨ Most Popular
                  </div>
                )}

                <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] opacity-70">
                  Included
                </p>

                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>

                {plan.missing && (
                  <div className="mt-8 rounded-2xl border border-white/15 bg-black/25 p-5">
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-white/70">
                      Upgrade to unlock
                    </p>

                    <ul className="space-y-3 text-white/90">
                      {plan.missing.map((item) => (
                        <li key={item}>✕ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={() => {
                    if (plan.name === "Free") {
                      window.location.href = "/auth/signup";
                      return;
                    }

                    window.location.href =
                      plan.name === "Premium"
                        ? "/matchups/checkout?plan=premium"
                        : "/matchups/checkout?plan=vip";
                  }}
                  className={`mt-10 block rounded-2xl py-4 text-center font-black transition hover:scale-105 ${
                    plan.name === "VIP"
                      ? "bg-yellow-300 text-black"
                      : plan.featured
                      ? "bg-[#b30018] text-white"
                      : "bg-white text-[#b30018]"
                  }`}
                >
                  {plan.name === "Free"
                    ? "Free Plan"
                    : plan.name === "Premium"
                    ? "Upgrade to Premium"
                    : "Become VIP"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display text-center text-7xl font-bold">
          Testimonials
        </h2>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur-xl"
            >
              <div className="mb-6 text-5xl text-white/20">“</div>

              <p className="text-lg leading-8 text-white/80">{item.text}</p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-[#b30018]">
                  {item.name.charAt(0)}
                </div>

                <div>
                  <p className="text-xl font-black">{item.name}</p>
                  <p className="text-sm text-white/60">DMs Community</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="newsletter" className="mx-auto max-w-5xl px-6 py-24">
        <div className="relative overflow-hidden rounded-[3rem] bg-white p-12 text-black shadow-2xl">
          <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-red-100 blur-3xl" />

          <div className="relative z-10 text-center">
            <p className="font-bold uppercase tracking-[0.3em] text-red-700">
              Stay Connected
            </p>

            <h2 className="font-display mt-4 text-6xl font-bold">
              Join Our Newsletter
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-black/70">
              Receive relationship wisdom, mentorship updates, events,
              counselling resources and exclusive content from Delly’s Matchups.
            </p>

            <form
              onSubmit={async (event) => {
                event.preventDefault();

                const formElement = event.currentTarget;
                const email = formElement.email.value.trim().toLowerCase();

                const oldMessage =
                  document.getElementById("newsletter-message");

                if (oldMessage) oldMessage.remove();

                const { error } = await supabase
                  .from("newsletter_subscribers")
                  .insert([{ email }]);

                const message = document.createElement("div");

                message.id = "newsletter-message";
                message.className =
                  "mt-6 rounded-2xl px-6 py-4 text-center font-bold";

                if (error) {
                  if (error.message.includes("newsletter_subscribers_email_key")) {
                    message.className += " bg-yellow-100 text-yellow-700";
                    message.innerText =
                      "You are already subscribed to our newsletter.";
                  } else {
                    message.className += " bg-red-100 text-red-700";
                    message.innerText =
                      "Unable to subscribe. Please try again.";
                  }

                  formElement.appendChild(message);
                  return;
                }

                message.className += " bg-green-100 text-green-700";
                message.innerText =
                  "✓ Successfully subscribed to the Delly's Matchups newsletter.";

                formElement.appendChild(message);
                formElement.reset();
              }}
              className="mt-10 flex flex-col gap-4 md:flex-row"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                className="h-16 flex-1 rounded-full border border-black/10 px-6 outline-none"
                required
              />

              <button
                type="submit"
                className="rounded-full bg-[#b30018] px-10 font-black text-white transition hover:scale-105"
              >
                Subscribe
              </button>
            </form>

            {newsletterSuccess && (
              <div className="mt-6 rounded-full bg-green-100 px-6 py-4 text-center font-bold text-green-700">
                Successfully subscribed to the DMs newsletter.
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <p className="font-bold uppercase tracking-[0.3em] text-white/70">
            Moments & Memories
          </p>

          <h2 className="font-display mt-4 text-7xl font-bold">Gallery</h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {gallery.map((image, index) => (
            <motion.div
              key={image}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-3 backdrop-blur-xl"
            >
              <img
                src={image}
                alt="gallery"
                className="h-[500px] w-full rounded-[2rem] bg-white/5 object-cover transition duration-700 group-hover:scale-105"
              />
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="mt-24 border-t border-white/10 bg-black/20 px-6 py-16 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-4">
          <div>
            <img
              src="/dellys-logo.png"
              alt="Delly's Matchups"
              className="h-32 w-auto object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]"
            />

            <p className="mt-6 max-w-sm leading-7 text-white/70">
              A global faith-based matchmaking, counselling and mentorship
              platform redefining authentic relationships through wisdom,
              healing and purpose.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-black">Quick Links</h3>

            <div className="mt-6 space-y-4 text-white/70">
              <a className="block hover:text-white" href="/">
                Home
              </a>

              <a className="block hover:text-white" href="/about/platform">
                The Platform
              </a>

              <a className="block hover:text-white" href="/about/founder">
                The Founder
              </a>

              <a className="block hover:text-white" href="/about/academy">
                The Academy
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">Counselling</h3>

            <div className="mt-6 space-y-4 text-white/70">
              <a
                className="block hover:text-white"
                href="/counselling/premarital"
              >
                Premarital Counselling
              </a>

              <a className="block hover:text-white" href="/counselling/marital">
                Marital Counselling
              </a>

              <a className="block hover:text-white" href="/counselling/healing">
                Emotional Healing
              </a>

              <a className="block hover:text-white" href="/counselling/coaching">
                Mentorship & Coaching
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black">Company Information</h3>

            <div className="mt-6 space-y-4 text-white/70">
              <p>DELLY&apos;S MATCHUPS LTD</p>
              <p>Registered in England &amp; Wales</p>
              <p>Company No: 17251701</p>

              <a
                className="block hover:text-white"
                href="https://wa.me/237676257187"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>

              <a
                className="block hover:text-white"
                href="https://www.facebook.com/dellysmatchupsre"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>

              <a
                className="block hover:text-white"
                href="https://www.instagram.com/dellysmatchups"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>

              <a
                className="block hover:text-white"
                href="mailto:infodellysmatchups@gmail.com"
              >
                Mail Us
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          © 2026 DELLY&apos;S MATCHUPS LTD. Company No. 17251701. Registered in
          England &amp; Wales. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
