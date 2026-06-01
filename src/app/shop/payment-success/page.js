"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

function ShopPaymentSuccessContent() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get("name") || "Friend";

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] bg-[#c1121f] p-8 text-center shadow-2xl md:p-12">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl text-[#b30018]">
            ✓
          </div>

          <h1 className="font-display mt-10 text-6xl font-bold leading-none">
            Payment Successful
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Thank you, {firstName}! Your order has been received successfully.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <Link
              href="/shop/books"
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
            >
              Continue Shopping
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-8 py-4 font-black text-white transition hover:bg-white/10"
            >
              Go To Dashboard
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export default function ShopPaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading payment...</p>
        </main>
      }
    >
      <ShopPaymentSuccessContent />
    </Suspense>
  );
}
