"use client";

import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function AcademyPaymentPendingPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] bg-black/25 p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-yellow-400 text-5xl text-black">
            ⏳
          </div>

          <h1 className="font-display mt-8 text-6xl font-bold">
            Payment Submitted
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Your payment proof has been received and is awaiting
            confirmation by our team.
          </p>

          <p className="mt-6 text-white/70">
            You will receive access once payment has been verified.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <a
              href="/contact"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Contact Support
            </a>

            <a
              href="/about/academy"
              className="rounded-full border border-white/20 px-8 py-4 font-black"
            >
              Back To Academy
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
