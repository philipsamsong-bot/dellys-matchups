// src/app/counselling/payment/page.js
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const prices = {
  individual: "50.00",
  couple: "100.00",
  international_individual: "100.00",
  international_couple: "200.00",
};

function CounsellingPaymentContent() {
  const searchParams = useSearchParams();
  const paypalRef = useRef(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [sessionType, setSessionType] = useState(
    searchParams.get("type") || "individual"
  );
  const [paid, setPaid] = useState(false);

  const amount = prices[sessionType] || prices.individual;

  useEffect(() => {
    if (!paypalClientId || !paypalRef.current) return;

    function renderButtons() {
      if (!window.paypal || !paypalRef.current) return;

      paypalRef.current.innerHTML = "";

      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "pill",
            label: "paypal",
          },

          createOrder(data, actions) {
            return actions.order.create({
              purchase_units: [
                {
                  description: `DMs Counselling - ${sessionType}`,
                  amount: {
                    currency_code: "USD",
                    value: amount,
                  },
                },
              ],
            });
          },

          onApprove(data, actions) {
            return actions.order.capture().then(async (details) => {
              const bookingId = searchParams.get("booking");
              const paidAmount =
                details.purchase_units?.[0]?.amount?.value || amount;

              if (!bookingId) {
                alert("Booking ID is missing.");
                return;
              }

              const { error: updateError } = await supabase
                .from("counselling_bookings")
                .update({
                  payment_status: "paid",
                  paypal_order_id: data.orderID,
                  paid_amount: paidAmount,
                  paid_at: new Date().toISOString(),
                })
                .eq("id", bookingId);

              if (updateError) {
                alert(updateError.message);
                return;
              }

              const { data: booking, error: bookingError } = await supabase
                .from("counselling_bookings")
                .select("*")
                .eq("id", bookingId)
                .single();

              if (bookingError) {
                alert(bookingError.message);
                return;
              }

              const emailResponse = await fetch("/api/send-booking-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fullName: booking.full_name,
                  email: booking.email,
                  service: booking.service,
                  preferredDate: booking.preferred_date,
                  amount: paidAmount,
                }),
              });

              const emailResult = await emailResponse.json();

              if (!emailResponse.ok) {
                alert(
                  emailResult.error ||
                    "Payment succeeded, but email failed."
                );
                return;
              }

              setPaid(true);
              localStorage.setItem(
                "clientName",
                booking.full_name?.split(" ")[0] || "Friend"
              );

              window.location.href = "/counselling/payment-success";
            });
          },

          onCancel() {
            alert("Payment cancelled.");
          },

          onError(error) {
            console.error(error);
            alert("PayPal payment failed. Please try again.");
          },
        })
        .render(paypalRef.current);
    }

    const existingScript = document.querySelector("#paypal-sdk");

    if (existingScript) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
    script.async = true;
    script.onload = renderButtons;
    document.body.appendChild(script);
  }, [paypalClientId, sessionType, amount, searchParams]);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Secure Payment
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none">
            Counselling Payment
          </h1>

          <p className="mt-6 text-lg leading-8 text-white/75">
            Complete your payment to confirm your counselling or mentorship
            session.
          </p>

          <div className="mt-10">
            <label className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              Session Type
            </label>

            <select
              value={sessionType}
              onChange={(event) => setSessionType(event.target.value)}
              className="mt-4 h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
            >
              <option value="individual" className="text-black">
                Individual Session - $50
              </option>
              <option value="couple" className="text-black">
                Couple Session - $100
              </option>
              <option value="international_individual" className="text-black">
                International Individual Session - $100
              </option>
              <option value="international_couple" className="text-black">
                International Couple Session - $200
              </option>
            </select>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white/10 p-6">
            <p className="text-white/70">Amount Due</p>
            <p className="mt-2 text-6xl font-black">${amount}</p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              MTN Mobile Money Option
            </p>

            <p className="mt-4 text-lg leading-8 text-white/80">
              You may also pay through MTN Mobile Money using:
            </p>

            <p className="mt-4 text-3xl font-black">+237 676 25 71 87</p>

            <p className="mt-4 text-white/70">
              After payment, contact us on WhatsApp with your transaction ID for
              manual confirmation.
            </p>

            <a
              href="https://wa.me/237676257187"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
            >
              Send MTN MoMo Proof
            </a>
          </div>

          {!paypalClientId ? (
            <div className="mt-10 rounded-2xl bg-white p-6 font-bold text-[#b30018]">
              Missing PayPal Client ID. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to
              .env.local.
            </div>
          ) : (
            <div className="mt-10 rounded-[2rem] bg-white p-6">
              <div ref={paypalRef} />
            </div>
          )}

          {paid && (
            <p className="mt-6 text-center font-bold text-red-100">
              Payment successful.
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export default function CounsellingPaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          Loading payment page...
        </main>
      }
    >
      <CounsellingPaymentContent />
    </Suspense>
  );
}
