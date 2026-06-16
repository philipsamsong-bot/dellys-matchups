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

const mobileMoney = {
  name: "Victorine Ncham",
  number: "+237 676 25 71 87",
  whatsapp: "https://wa.me/237676257187",
};

function CounsellingPaymentContent() {
  const searchParams = useSearchParams();
  const paypalRef = useRef(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [sessionType, setSessionType] = useState(
    searchParams.get("type") || "individual"
  );
  const [paymentMethod, setPaymentMethod] = useState("PayPal / Card");
  const [paid, setPaid] = useState(false);

  const amount = prices[sessionType] || prices.individual;

  useEffect(() => {
    if (
      paymentMethod !== "PayPal / Card" ||
      !paypalClientId ||
      !paypalRef.current
    ) {
      return;
    }

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
                  payment_method: "PayPal / Card",
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

              await supabase.from("payments").insert({
                customer_name: booking.full_name,
                customer_email: booking.email,
                purpose: "counselling",
                item_name: `Counselling - ${sessionType}`,
                amount: Number(paidAmount),
                currency: "USD",
                payment_method: "PayPal / Card",
                status: "paid",
                provider_reference: data.orderID,
                notes: `Booking ID: ${bookingId}`,
              });

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
                  emailResult.error || "Payment succeeded, but email failed."
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
  }, [paypalClientId, sessionType, amount, searchParams, paymentMethod]);

  async function handleManualPaymentSubmit() {
    const bookingId = searchParams.get("booking");

    if (!bookingId) {
      alert("Booking ID is missing.");
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

    const { error: updateError } = await supabase
      .from("counselling_bookings")
      .update({
        payment_status: "pending_confirmation",
        payment_method: paymentMethod,
        paid_amount: amount,
      })
      .eq("id", bookingId);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      customer_name: booking.full_name,
      customer_email: booking.email,
      purpose: "counselling",
      item_name: `Counselling - ${sessionType}`,
      amount: Number(amount),
      currency: "USD",
      payment_method: paymentMethod,
      status: "pending_confirmation",
      notes: `Booking ID: ${bookingId}. Client selected ${paymentMethod}.`,
    });

    if (paymentError) {
      alert(paymentError.message);
      return;
    }

    alert(
      "Your payment choice has been submitted. Please send proof on WhatsApp for confirmation."
    );
  }

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

          <div className="mt-10">
            <label className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
              Choose Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="mt-4 h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
            >
              <option className="text-black">PayPal / Card</option>
              <option className="text-black">Mobile Money</option>
              <option className="text-black">Bank Transfer</option>
            </select>
          </div>

          {paymentMethod === "PayPal / Card" && (
            <>
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
            </>
          )}

          {paymentMethod === "Mobile Money" && (
            <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                MTN Mobile Money
              </p>

              <p className="mt-4 text-lg leading-8 text-white/80">
                Send your payment using the Mobile Money details below.
              </p>

              <div className="mt-5 rounded-2xl bg-black/20 p-5">
                <p className="text-white/70">Account Name</p>
                <p className="mt-1 text-2xl font-black">
                  {mobileMoney.name}
                </p>

                <p className="mt-5 text-white/70">Mobile Money Number</p>
                <p className="mt-1 text-3xl font-black">
                  {mobileMoney.number}
                </p>
              </div>

              <p className="mt-5 text-white/70">
                After payment, send your transaction ID or screenshot on
                WhatsApp for manual confirmation.
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <a
                  href={mobileMoney.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
                >
                  Send MoMo Proof
                </a>

                <button
                  type="button"
                  onClick={handleManualPaymentSubmit}
                  className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20"
                >
                  I Have Paid
                </button>
              </div>
            </div>
          )}

          {paymentMethod === "Bank Transfer" && (
            <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                Bank Transfer
              </p>

              <p className="mt-4 text-lg leading-8 text-white/80">
                Bank transfer details will be provided by Delly&apos;s Matchups.
                After payment, send your transaction proof on WhatsApp for
                confirmation.
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <a
                  href={mobileMoney.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
                >
                  Send Bank Proof
                </a>

                <button
                  type="button"
                  onClick={handleManualPaymentSubmit}
                  className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20"
                >
                  I Have Paid
                </button>
              </div>
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
