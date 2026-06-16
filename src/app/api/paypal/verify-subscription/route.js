import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function PaymentSuccessPage({ searchParams }) {
  const plan = searchParams?.plan || "premium";
  const planName = plan === "vip" ? "VIP Elite" : "Premium";

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
            Your membership payment was completed successfully. Your account
            will now unlock your new Matchups benefits.
          </p>

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
              href="/browse"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20"
            >
              Browse Matchups
            </a>
          </div>

          <p className="mt-10 text-sm text-white/50">
            If your membership does not update immediately, refresh your
            dashboard in a few seconds.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
