"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResetPassword(event) {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
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

        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 w-full max-w-xl rounded-[3rem] border border-white/10 bg-black/25 p-8 shadow-2xl backdrop-blur-xl sm:p-12"
        >
          <div className="mb-8 flex justify-center">
            <a href="/" className="rounded-2xl bg-white px-4 py-2 shadow-2xl">
              <img
                src="/dellys-logo.png"
                alt="Delly's Matchups"
                className="h-24 w-auto object-contain"
              />
            </a>
          </div>

          <h1 className="font-display text-center text-5xl font-bold leading-none">
            Reset Password
          </h1>

          <p className="mt-4 text-center text-white/70">
            Enter your email address and we&apos;ll send you a password reset
            link.
          </p>

          {sent ? (
            <div className="mt-8 rounded-2xl bg-green-100 px-5 py-4 text-center font-bold text-green-700">
              Password reset link sent. Please check your email.
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              <input
                type="email"
                placeholder="Email address"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-white/30"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white py-4 font-black text-[#b30018] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <a href="/auth/login" className="font-bold text-red-100">
              Back to Sign In
            </a>
          </div>
        </motion.div>
      </main>
    </>
  );
}
