"use client";

import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function AcademyPaymentSuccessPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] bg-black/25 p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-500 text-6xl">
            ✓
          </div>

          <h1 className="font-display mt-8 text-6xl font-bold">
            Enrollment Successful
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Thank you for enrolling in Delly&apos;s Matchups Academy.
            Your payment has been received successfully.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <a
              href="/dashboard"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Go To Dashboard
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
