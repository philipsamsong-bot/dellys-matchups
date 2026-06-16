"use client";

import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function MembershipPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <p className="font-black uppercase tracking-[0.45em] text-red-100">
              Matchups Membership
            </p>

            <h1 className="font-display mt-6 text-6xl font-bold md:text-8xl">
              Choose Your Plan
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg text-white/80">
              Find meaningful relationships, unlock premium features,
              and receive priority matchmaking support.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">

            <div className="rounded-[3rem] border border-white/10 bg-black/20 p-10">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                Free
              </p>

              <h2 className="mt-4 text-5xl font-black">
                £0
              </h2>

              <div className="mt-8 space-y-4 text-white/80">
                <p>✓ Create Profile</p>
                <p>✓ Upload 1 Photo</p>
                <p>✓ Browse Members</p>
                <p>✓ Like Profiles</p>
                <p>✓ Receive Notifications</p>
                <p>🔒 Messaging Locked</p>
                <p>🔒 See Who Liked You</p>
              </div>

              <button className="mt-10 w-full rounded-full bg-white px-6 py-4 font-black text-[#b30018]">
                Current Plan
              </button>
            </div>

            <div className="rounded-[3rem] border-4 border-white bg-white p-10 text-[#b30018] shadow-2xl">

              <div className="mb-5 inline-flex rounded-full bg-[#b30018] px-5 py-2 text-sm font-black uppercase text-white">
                Most Popular
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em]">
                Premium
              </p>

              <h2 className="mt-4 text-5xl font-black">
                £19.99
              </h2>

              <p className="mt-2 font-bold">
                Monthly Subscription
              </p>

              <div className="mt-8 space-y-4">
                <p>✓ Everything in Free</p>
                <p>✓ Unlimited Messaging</p>
                <p>✓ See Who Liked You</p>
                <p>✓ Full Profile Access</p>
                <p>✓ Upload More Photos</p>
                <p>✓ Priority Visibility</p>
              </div>

              <button
                className="mt-10 w-full rounded-full bg-[#b30018] px-6 py-4 font-black text-white"
              >
                Upgrade to Premium
              </button>
            </div>

            <div className="rounded-[3rem] border-2 border-yellow-400 bg-gradient-to-b from-yellow-500/20 to-black/30 p-10 shadow-2xl">

              <div className="mb-5 inline-flex rounded-full bg-yellow-400 px-5 py-2 text-sm font-black uppercase text-black">
                VIP
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-200">
                VIP Elite
              </p>

              <h2 className="mt-4 text-5xl font-black text-yellow-300">
                £49.99
              </h2>

              <p className="mt-2 font-bold text-yellow-100">
                Monthly Subscription
              </p>

              <div className="mt-8 space-y-4 text-white">
                <p>✓ Everything in Premium</p>
                <p>✓ VIP Badge</p>
                <p>✓ VIP Profile Styling</p>
                <p>✓ Priority Matchmaking</p>
                <p>✓ Featured Visibility</p>
                <p>✓ Faster Support</p>
                <p>✓ Exclusive VIP Events</p>
              </div>

              <button
                className="mt-10 w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black"
              >
                Become VIP
              </button>
            </div>

          </div>

          <div className="mt-20 rounded-[3rem] border border-white/10 bg-black/20 p-10">
            <h2 className="text-4xl font-black">
              Payment Methods
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-6 text-center">
                PayPal
              </div>

              <div className="rounded-2xl bg-white/10 p-6 text-center">
                Google Pay
              </div>

              <div className="rounded-2xl bg-white/10 p-6 text-center">
                Apple Pay
              </div>

              <div className="rounded-2xl bg-white/10 p-6 text-center">
                Mobile Money
              </div>
            </div>

            <p className="mt-8 text-white/70">
              Mobile Money support will include Cameroon MTN Mobile Money and Orange Money.
            </p>
          </div>

        </div>
      </main>

      <SiteFooter />
    </>
  );
}
