"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

const petals = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
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
          animate={{ y: 1200, rotate: 720, opacity: [0, 0.8, 0] }}
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

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <>
      <DashboardChrome />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#b30018] px-5 py-20 text-white">
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

        <Petals />

        <div className="absolute left-[-10%] top-10 h-96 w-96 rounded-full bg-red-300/30 blur-3xl" />
        <div className="absolute bottom-10 right-[-10%] h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[3rem] border border-white/10 bg-black/25 shadow-2xl backdrop-blur-xl lg:grid-cols-2"
        >
          <div className="hidden flex-col justify-between bg-black/30 p-10 lg:flex">
            <a
              href="/"
              className="inline-flex w-fit rounded-2xl bg-white px-4 py-2 shadow-2xl"
            >
              <img
                src="/dellys-logo.png"
                alt="Delly's Matchups"
                className="h-24 w-auto object-contain"
              />
            </a>

            <div>
              <p className="font-bold uppercase tracking-[0.3em] text-red-100">
                Welcome Back
              </p>

              <h1 className="font-display mt-5 text-7xl font-bold leading-none">
                Continue your relationship journey.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
                Sign in to access your dashboard, matches, messages,
                membership, counselling resources, and Delly’s Matchups
                community.
              </p>
            </div>

            <p className="text-sm text-white/50">
              Redefining Authentic Relationships.
            </p>
          </div>

          <div className="p-8 sm:p-12">
            <div className="mb-8 flex justify-center lg:hidden">
              <a href="/" className="rounded-2xl bg-white px-4 py-2 shadow-2xl">
                <img
                  src="/dellys-logo.png"
                  alt="Delly's Matchups"
                  className="h-24 w-auto object-contain"
                />
              </a>
            </div>

            <h2 className="font-display text-6xl font-bold leading-none">
              Sign In
            </h2>

            <p className="mt-4 text-white/70">
              Welcome back to Delly&apos;s Matchups.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <input
                type="email"
                placeholder="Email address"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-white/30"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 pr-20 text-white outline-none placeholder:text-white/45 focus:border-white/30"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/70 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white py-4 font-black text-[#b30018] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 text-center text-sm text-white/65 sm:flex-row sm:justify-between">
              <a href="/auth/signup" className="font-bold text-white">
                Create an account
              </a>

              <a href="/auth/forgot-password" className="font-bold text-red-100">
                Forgot password?
              </a>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
