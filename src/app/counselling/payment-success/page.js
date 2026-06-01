"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function PaymentSuccessPage() {
  const [firstName, setFirstName] = useState("Friend");

  useEffect(() => {
    const storedName = localStorage.getItem("clientName");

    if (storedName) {
      setFirstName(storedName);
    }
  }, []);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-14">
          <div className="flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-500 text-5xl font-black text-white shadow-2xl">
              ✓
            </div>
          </div>

          <h1 className="mt-10 text-center text-5xl font-black md:text-6xl">
            Payment Successful
          </h1>

          <p className="mt-6 text-center text-2xl font-bold text-white">
            Thank you, {firstName}.
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-white/80">
            Your counselling or mentorship session has been successfully
            confirmed. We have received your booking request and payment.
          </p>

          <div className="mt-12 rounded-[2rem] bg-white/10 p-8">
            <h2 className="text-2xl font-bold">
              What Happens Next?
            </h2>

            <div className="mt-6 space-y-5 text-white/80">
              <p>
                • Our team will review your booking request.
              </p>

              <p>
                • You will be contacted through your provided email address or
                WhatsApp number.
              </p>

              <p>
                • Your counselling session date and preferred communication
                method will be confirmed.
              </p>

              <p>
                • Follow-up instructions and guidance will also be provided
                where necessary.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Link
              href="/"
              className="flex h-16 items-center justify-center rounded-2xl bg-white font-black text-[#b30018] transition hover:scale-[1.02]"
            >
              Return Home
            </Link>

            <Link
              href="/counselling"
              className="flex h-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 font-black text-white transition hover:bg-white hover:text-[#b30018]"
            >
              Back to Counselling
            </Link>
          </div>

          <div className="mt-14 rounded-[2rem] border border-white/10 bg-black/20 p-8 text-center">
            <p className="text-lg font-semibold text-white/90">
              Delly's Matchups (DMs)
            </p>

            <p className="mt-4 text-white/70">
              Biblical Principles. Practical Wisdom. Lasting Transformation.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
