import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function PaymentCancelledPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] border border-white/10 bg-black/25 p-10 text-center shadow-2xl backdrop-blur-xl md:p-16">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl">
            💳
          </div>

          <p className="mt-8 font-black uppercase tracking-[0.35em] text-red-100">
            Checkout Cancelled
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-8xl">
            No worries.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Your payment was not completed and your card was not charged. You
            can return to your membership options whenever you are ready.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/membership"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
            >
              Back to Membership
            </a>

            <a
              href="/dashboard"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20"
            >
              Go to Dashboard
            </a>
          </div>

          <div className="mt-12 rounded-[2rem] bg-white/10 p-6 text-left">
            <p className="font-black uppercase tracking-[0.25em] text-red-100">
              Still interested?
            </p>

            <p className="mt-4 leading-7 text-white/75">
              Premium unlocks messaging, likes visibility, and full profiles.
              VIP adds a luxury badge, priority visibility, and elite Matchups
              placement.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
