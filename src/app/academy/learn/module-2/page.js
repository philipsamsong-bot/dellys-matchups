"use client";

import DashboardChrome from "@/app/components/DashboardChrome";

export default function Module2Page() {
  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl rounded-[3rem] bg-black/20 p-12 text-center shadow-2xl">

          <p className="font-black uppercase tracking-[0.4em] text-yellow-300">
            Module 2
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold">
            Coming Soon
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-9 text-white/75">
            This academy lesson is currently being prepared.
            New lessons will be released very soon.
          </p>

        </div>
      </main>
    </>
  );
}
