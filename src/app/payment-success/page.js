"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "premium";
  const subscriptionId = searchParams.get("subscription_id");
  const planName = plan === "vip" ? "VIP Elite" : "Premium";

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your membership upgrade...");

  useEffect(() => {
    async function verifySubscription() {
      if (!subscriptionId) {
        setStatus("warning");
        setMessage("Payment completed, but subscription ID was not found.");
        return;
      }

      try {
        const response = await fetch("/api/paypal/verify-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscriptionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("warning");
          setMessage(data.error || "Payment succeeded, but upgrade verification is pending.");
          return;
        }

        setStatus("success");
        setMessage(`Your ${data.plan === "vip" ? "VIP Elite" : "Premium"} membership is now active.`);
      } catch (error) {
        setStatus("warning");
        setMessage(error.message || "Payment succeeded, but verification failed.");
      }
    }

    verifySubscription();
  }, [subscriptionId]);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-black/25 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl shadow-2xl">
            {plan === "vip" ? "👑" : "✨"}
          </div>

          <p className="mt-8 font-black uppercase tracking-[0.35em] text-red-100">
            Payment Successful
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-8xl">
            Welcome to {planName}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
            {message}
          </p>

          <div className="mt-10 rounded-2xl bg-white/10 p-5 font-black">
            {status === "verifying" && "⏳ Verifying upgrade..."}
            {status === "success" && "✅ Membership upgraded"}
            {status === "warning" && "⚠️ Upgrade pending"}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="text-3xl">💬</p>
              <p className="mt-3 font-black">Messaging</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <p className="text-3xl">❤️</p>
              <p className="mt-3 font-black">Likes Visibility</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <p className="text-3xl">{plan === "vip" ? "👑" : "⭐"}</p>
              <p className="mt-3 font-black">
                {plan === "vip" ? "VIP Priority" : "Premium Access"}
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/dashboard"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
            >
              Go to Dashboard
            </a>

            <a
              href="/membership"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20"
            >
              View Membership
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
