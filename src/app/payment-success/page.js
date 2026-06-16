"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "friend";

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 py-20 text-white">
        <section className="mx-auto max-w-4xl rounded-[3rem] bg-black/25 p-12 text-center shadow-2xl">
          <p className="font-black uppercase tracking-[0.35em] text-yellow-300">
            Payment Successful
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold">
            Thank you, {name} 🎉
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-white/75">
            Your payment was received successfully. We will process your order
            and contact you shortly.
          </p>

          <a
            href="/dashboard"
            className="mt-10 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
          >
            Go To Dashboard
          </a>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<main className="p-10">Loading...</main>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
