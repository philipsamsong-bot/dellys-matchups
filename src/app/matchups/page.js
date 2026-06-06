"use client";

import { supabase } from "@/lib/supabase";

export default function MatchupsPage() {
  async function handleCheckout(plan) {
    try {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }
  
      const response = await fetch("/api/paypal/subsriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: user?.id,
          email: user?.email,
        }),
      });
  
      const data = await response.json();
      if (!response.ok){
        alert (data.error || "Unable to start subscription.");
        return
      }
  
      if (data.url) {
        window.location.href = data.url;
        return;
      }
  
      alert("No PayPal approval URL returned.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }
  

  return (
    <main className="min-h-screen bg-[#080304] px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Membership Plans
          </p>

          <h1 className="mt-4 font-serif text-6xl font-black">
            <span className="text-white">Choose Your </span>
            <span className="text-red-600">Experience</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/60">
            Delly&apos;s Matchups is built for serious people seeking real
            connections through a trusted matchmaking community.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/50">
              Free
            </p>

            <h2 className="mt-4 text-5xl font-black">£0</h2>

            <p className="mt-4 text-white/60">
              Explore the Delly&apos;s Matchups community.
            </p>

            <ul className="mt-10 space-y-4 text-white/75">
              <li>✔ Create account</li>
              <li>✔ Create profile</li>
              <li>✔ Upload 1 photo</li>
              <li>✔ Browse profiles</li>
              <li>✔ Like profiles</li>
              <li>✔ Receive likes/messages notifications</li>
              <li>❌ View full profiles</li>
              <li>❌ See who liked you</li>
              <li>❌ Chat/connect</li>
            </ul>

            <button className="mt-auto rounded-2xl border border-white/10 py-4 font-bold text-white/70">
              Current Free Plan
            </button>
          </div>

          <div className="relative flex flex-col rounded-[2.5rem] border border-red-500/40 bg-red-950/20 p-8 shadow-2xl shadow-red-900/30">
            <div className="absolute right-6 top-6 rounded-full bg-red-600 px-4 py-2 text-sm font-black">
              MOST POPULAR
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
              Premium
            </p>

            <h2 className="mt-4 text-5xl font-black">$20</h2>

            <p className="mt-2 text-white/60">per month</p>

            <p className="mt-4 text-white/70">
              Full matchmaking experience with unrestricted interaction.
            </p>

            <ul className="mt-10 space-y-4 text-white/90">
              <li>✔ Everything in Free</li>
              <li>✔ Upload up to 5 photos</li>
              <li>✔ View full profiles</li>
              <li>✔ See who liked you</li>
              <li>✔ Direct messaging</li>
              <li>✔ Unlimited connections</li>
              <li>✔ Priority visibility</li>
              <li>✔ Full profile access</li>
            </ul>

            <button
              type="button"
              onClick={() => handleCheckout("premium")}
              className="mt-auto rounded-2xl bg-red-700 py-4 font-bold transition hover:bg-red-800"
            >
              Upgrade to Premium
            </button>
          </div>

          <div className="flex flex-col rounded-[2.5rem] border border-yellow-400/40 bg-yellow-400/10 p-8 shadow-2xl shadow-yellow-900/20">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-300">
              VIP
            </p>

            <h2 className="mt-4 text-5xl font-black">$100</h2>

            <p className="mt-2 text-white/60">per month</p>

            <p className="mt-4 text-white/70">
              Elite matchmaking support with premium visibility and private
              guidance.
            </p>

            <ul className="mt-10 space-y-4 text-white/90">
              <li>✔ Everything in Premium</li>
              <li>✔ Unlimited photo uploads</li>
              <li>✔ VIP badge</li>
              <li>✔ Facebook feature visibility</li>
              <li>✔ Priority placement</li>
              <li>✔ Private counselling</li>
              <li>✔ Personalized matchmaking support</li>
              <li>✔ Free copy of I do I don&apos;t</li>
              <li>✔ VIP recognition</li>
            </ul>

            <button
              type="button"
              onClick={() => handleCheckout("vip")}
              className="mt-auto rounded-2xl bg-yellow-400 py-4 font-bold text-black transition hover:bg-yellow-300"
            >
              Become VIP
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
