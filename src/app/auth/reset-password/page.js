"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(Boolean(session));
      setCheckingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(event) {
    event.preventDefault();

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: form.password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setUpdated(true);
  }

  return (
    <>
      <DashboardChrome />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#b30018] px-5 py-20 text-white">
        <motion.div
           initial={{ y: 60, opacity: 0, scale: 0.96 }}
           animate={{ y: 0, opacity: 1, scale: 1 }}
           transition={{ duration: 0.7 }}
           className="relative z-10 w-full max-w-xl rounded-[3rem] border border-white/10 bg-black/25 p-8 shadow-2xl backdrop-blur-xl sm:p-12"
         >
           <div className="mb-8 flex justify-center">
             <a href="/" className="rounded-2xl bg-white px-4 py-2 shadow-2xl">
               <img
                 src="/dellys-logo.webp"
                 alt="Delly's Matchups"
                 className="h-24 w-auto object-contain"
               />
             </a>
           </div>
 
           <h1 className="font-display text-center text-5xl font-bold leading-none">
             Create New Password
           </h1>
 
           <p className="mt-4 text-center text-white/70">
             Enter and confirm your new password.
           </p>
 
           {checkingSession ? (
             <div className="mt-8 rounded-2xl bg-white/10 px-5 py-4 text-center font-bold text-white">
               Checking reset link...
             </div>
           ) : !hasSession ? (
             <div className="mt-8 space-y-5">
               <div className="rounded-2xl bg-yellow-100 px-5 py-4 text-center font-bold text-yellow-800">
                 This reset link is invalid or has expired. Please request a new
                 password reset link.
               </div>
 
               <a
                 href="/auth/forgot-password"
                 className="block rounded-2xl bg-white py-4 text-center font-black text-[#b30018]"
               >
                 Request New Link
               </a>
             </div>
           ) : updated ? (
             <div className="mt-8 space-y-5">
               <div className="rounded-2xl bg-green-100 px-5 py-4 text-center font-bold text-green-700">
                 Password updated successfully.
               </div>
 
               <a
                 href="/auth/login"
                 className="block rounded-2xl bg-white py-4 text-center font-black text-[#b30018]"
               >
                 Go to Sign In
                 </a>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="mt-8 space-y-5">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 pr-20 text-white outline-none placeholder:text-white/45 focus:border-white/30"
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password: event.target.value,
                    })
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

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/45 focus:border-white/30"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({
                    ...form,
                    confirmPassword: event.target.value,
                  })
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white py-4 font-black text-[#b30018] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </motion.div>
      </main>
    </>
  );
}
