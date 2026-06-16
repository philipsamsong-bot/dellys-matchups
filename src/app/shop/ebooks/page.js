"use client";

import DashboardChrome from "@/app/components/DashboardChrome";

export default function EbooksPage() {
  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-20 text-white">
        <section className="mx-auto max-w-5xl rounded-[3rem] bg-black/25 p-12 text-center shadow-2xl">
          <p className="font-black uppercase tracking-[0.4em] text-yellow-300">
            Digital Bookstore
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold">
            eBooks Coming Soon 📚
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-white/75">
            Our digital library is being prepared. Relationship, faith,
            marriage, leadership and personal growth books will be available
            very soon.
          </p>

          <div className="mt-10 flex justify-center gap-5">
            <a
              href="/"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Back Home
            </a>

            <a
              href="/about/academy"
              className="rounded-full border border-white/20 px-8 py-4 font-black"
            >
              Visit Academy
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
