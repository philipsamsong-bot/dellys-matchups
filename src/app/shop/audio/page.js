"use client";

import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function AudioMessagesPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 py-20 text-white">

        <div className="mx-auto max-w-6xl rounded-[3rem] bg-black/20 p-12 text-center shadow-2xl">

          <p className="font-black uppercase tracking-[0.4em] text-yellow-300">
            Audio Library
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold">
            Audio Messages 🎧
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-white/75">
            Our transformational audio collection is currently being prepared.
            New healing, faith, dating, growth and self-worth messages will be uploaded soon.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-5">

            <AudioCard title="Healing" />

            <AudioCard title="Faith" />

            <AudioCard title="Dating" />

            <AudioCard title="Growth" />

            <AudioCard title="Self Worth" />

          </div>

          <div className="mt-12">

            <a
              href="/"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Back Home
            </a>

          </div>

        </div>

      </main>

      <SiteFooter />
    </>
  );
}

function AudioCard({ title }) {
  return (
    <div className="rounded-[2rem] bg-white/10 p-8">

      <div className="text-6xl">
        🎧
      </div>

      <h2 className="mt-5 text-2xl font-black">
        {title}
      </h2>

      <p className="mt-4 text-white/70">
        Coming Soon
      </p>

    </div>
  );
}
