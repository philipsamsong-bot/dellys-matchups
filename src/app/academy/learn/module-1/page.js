"use client";

import DashboardChrome from "@/app/components/DashboardChrome";

export default function Module1Page() {
  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">

        <div className="mx-auto max-w-5xl rounded-[3rem] bg-black/20 p-12 text-center shadow-2xl">

          <p className="font-black uppercase tracking-[0.4em] text-yellow-300">
            Module 1
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold">
            Coming Soon 🎓
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-9 text-white/75">
            This academy lesson is currently being prepared.
            New lessons will be released very soon.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-5">

            <a
              href="/dashboard/my-academy"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Back To My Academy
            </a>

            <a
              href="/dashboard"
              className="rounded-full border border-white/20 px-8 py-4 font-black"
            >
              Dashboard
            </a>

          </div>

        </div>

      </main>
    </>
  );
}
