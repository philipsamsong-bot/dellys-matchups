"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function activateSubscription() {
      try {
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const sessionResponse = await fetch(
          `/api/paypal/session?session_id=${sessionId}`
        );

        const sessionData = await sessionResponse.json();

        const plan =
          searchParams.get("plan") || "premium";

        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_plan: plan,
          })
          .eq("id", user.id);

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    }

    activateSubscription();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080304] px-6 text-white">
      <div className="max-w-xl rounded-3xl border border-green-500/30 bg-white/5 p-10 text-center">
        <h1 className="text-4xl font-black text-green-400">
          Payment Successful 🎉
        </h1>

        <p className="mt-4 text-white/70">
          {loading
            ? "Activating your membership..."
            : "Your membership is now active."}
        </p>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-2xl bg-red-700 px-6 py-4 font-bold hover:bg-red-800"
        >
          Go to Dashboard
        </a>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
