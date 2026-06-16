"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const mobileMoney = {
  name: "Victorine Ncham",
  number: "+237 676 25 71 87",
  whatsapp: "https://wa.me/237676257187",
};

const plans = {
  premium: {
    title: "Premium Membership",
    price: 20,
    badge: "Most Popular",
    description:
      "Unlock direct messaging, full profile viewing, likes, connection tools and priority visibility.",
  },

  vip: {
    title: "VIP Elite Membership",
    price: 100,
    badge: "VIP Elite",
    description:
      "Everything in Premium plus VIP badge, priority support, private counselling and elite visibility.",
  },
};

const emptyForm = {
  customer_name: "",
  customer_email: "",
  payment_method: "PayPal / Card",
  proof_url: "",
  notes: "",
};

function MatchupsCheckoutContent() {
  const searchParams = useSearchParams();

  const paypalRef = useRef(null);

  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const initialPlan =
    searchParams.get("plan") || "premium";

  const [selectedPlanKey, setSelectedPlanKey] =
    useState(
      plans[initialPlan]
        ? initialPlan
        : "premium"
    );

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const selectedPlan =
    plans[selectedPlanKey];

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!form.customer_name.trim()) {
      alert(
        "Please enter your full name."
      );

      return false;
    }

    if (!form.customer_email.trim()) {
      alert(
        "Please enter your email."
      );

      return false;
    }

    return true;
  }

  async function savePayment(
    status,
    providerReference = null
  ) {
    const { error } =
      await supabase
        .from("payments")
        .insert({
          customer_name:
            form.customer_name.trim(),

          customer_email:
            form.customer_email
              .trim()
              .toLowerCase(),

          purpose: "membership",

          item_name:
            selectedPlan.title,

          amount:
            selectedPlan.price,

          currency: "USD",

          payment_method:
            form.payment_method,

          status,

          provider_reference:
            providerReference,

          proof_url:
            form.proof_url,

          notes: `Plan: ${selectedPlanKey}

${form.notes || ""}`,
        });

    if (error) {
      throw new Error(
        error.message
      );
    }
  }
  useEffect(() => {
    if (
      form.payment_method !== "PayPal / Card" ||
      !paypalClientId ||
      !paypalRef.current
    ) {
      return;
    }

    function renderButtons() {
      if (!window.paypal || !paypalRef.current) {
        return;
      }

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
            if (!validateForm()) {
              return Promise.reject(
                new Error(
                  "Please complete your name and email first."
                )
              );
            }

            return actions.order.create({
              purchase_units: [
                {
                  description: `Delly's Matchups - ${selectedPlan.title}`,

                  amount: {
                    currency_code: "USD",

                    value:
                      selectedPlan.price.toFixed(
                        2
                      ),
                  },
                },
              ],
            });
          },

          onApprove(data, actions) {
            return actions
              .order
              .capture()
              .then(async () => {
                try {
                  setSaving(true);

                  await savePayment(
                    "paid",
                    data.orderID
                  );

                  alert(
                    "Membership payment successful."
                  );

                  window.location.href =
                    "/dashboard";
                } catch (error) {
                  alert(error.message);
                } finally {
                  setSaving(false);
                }
              });
          },

          onCancel() {
            alert(
              "Payment cancelled."
            );
          },

          onError(error) {
            console.error(
              "PayPal Error:",
              error
            );

            alert(
              "PayPal payment failed."
            );
          },
        })
        .render(paypalRef.current);
    }

    const existingScript =
      document.querySelector(
        "#paypal-sdk"
      );

    if (existingScript) {
      renderButtons();
      return;
    }

    const script =
      document.createElement(
        "script"
      );

    script.id = "paypal-sdk";

    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;

    script.async = true;

    script.onload =
      renderButtons;

    document.body.appendChild(
      script
    );
  }, [
    paypalClientId,
    form.payment_method,
    selectedPlanKey,
    form.customer_name,
    form.customer_email,
  ]);
  async function handleProofUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();

    const fileName = `payment-proofs/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("content-images")
      .upload(fileName, file, {
        upsert: true,
      });

    if (error) {
      setUploading(false);

      alert(error.message);

      return;
    }

    const { data } = supabase.storage
      .from("content-images")
      .getPublicUrl(fileName);

    setForm((current) => ({
      ...current,
      proof_url: data.publicUrl,
    }));

    setUploading(false);
  }

  async function handleManualSubmit() {
    if (!validateForm()) return;

    try {
      setSaving(true);

      await savePayment(
        "pending_confirmation"
      );

      alert(
        "Membership payment submitted successfully."
      );

      window.location.href =
        "/dashboard";
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">

        <section className="mx-auto max-w-7xl rounded-[3rem] border border-yellow-300/30 bg-black/30 p-10 shadow-2xl">

          <p className="font-black uppercase tracking-[0.35em] text-yellow-300">
            Delly&apos;s Matchups Membership
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold">
            Upgrade Your Love Journey
          </h1>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">

            <div>

              <div className="rounded-[2rem] bg-white/10 p-8">

                <h2 className="font-display text-5xl font-bold">
                  {selectedPlan.title}
                </h2>

                <p className="mt-6 text-lg text-white/75">
                  {selectedPlan.description}
                </p>

                <p className="mt-8 text-6xl font-black text-yellow-300">
                  ${selectedPlan.price}

                  <span className="ml-2 text-xl text-white">
                    USD / month
                  </span>
                </p>

              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">

                {Object.entries(plans).map(
                  ([key, plan]) => (

                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedPlanKey(
                          key
                        )
                      }

                      className={`rounded-2xl border p-6 text-left transition ${
                        selectedPlanKey === key
                          ? "border-yellow-300 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black"
                          : key === "vip"
                          ? "border-yellow-300/40 bg-gradient-to-br from-[#380006] via-[#7a0010] to-[#d4af37]"
                          : "border-white/15 bg-white/10"
                      }`}
                    >

                      <p className="text-xs font-black uppercase tracking-[0.3em]">
                        {plan.badge}
                      </p>

                      <h3 className="mt-4 font-display text-4xl font-bold">
                        {plan.title}
                      </h3>

                      <p className="mt-3 text-4xl font-black">
                        ${plan.price}
                      </p>

                    </button>
                  )
                )}

              </div>

            </div>

            <div>

              <div className="grid gap-5 md:grid-cols-2">

                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Full name"

                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white"
                />

                <input
                  type="email"
                  name="customer_email"
                  value={form.customer_email}
                  onChange={handleChange}
                  placeholder="Email address"

                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white"
                />

              </div>

              <h3 className="mt-10 font-display text-4xl font-bold">
                Payment Method
              </h3>

              <div className="mt-6 grid gap-5 md:grid-cols-3">

                {[
                  "PayPal / Card",
                  "Mobile Money",
                  "Bank Transfer",
                ].map((method) => (

                  <button
                    key={method}

                    type="button"

                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        payment_method:
                          method,
                      }))
                    }

                    className={`rounded-2xl p-5 font-black ${
                      form.payment_method ===
                      method
                        ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black"
                        : "bg-white text-[#b30018]"
                    }`}
                  >
                    {method}
                  </button>
                ))}

              </div>

              {form.payment_method ===
                "PayPal / Card" && (

                <div className="mt-8 rounded-2xl bg-white p-6 text-[#b30018]">

                  {!paypalClientId ? (

                    <p>
                      Missing PayPal Client ID
                    </p>

                  ) : (

                    <div ref={paypalRef} />

                  )}

                </div>
              )}

              {form.payment_method !==
                "PayPal / Card" && (

                <>
                  <textarea
                    name="notes"

                    value={form.notes}

                    onChange={
                      handleChange
                    }

                    rows="4"

                    placeholder="Optional notes"

                    className="mt-8 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white"
                  />

                  <input
                    type="file"

                    accept="image/*,.pdf"

                    onChange={
                      handleProofUpload
                    }

                    className="mt-6 w-full"
                  />

                  <button
                    type="button"

                    onClick={
                      handleManualSubmit
                    }

                    disabled={
                      saving ||
                      uploading
                    }

                    className="mt-8 w-full rounded-full bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-10 py-5 text-xl font-black text-black"
                  >

                    {saving
                      ? "Submitting..."
                      : `Submit Upgrade — $${selectedPlan.price} USD`}

                  </button>
                </>
              )}

            </div>

          </div>

        </section>

      </main>

      <SiteFooter />
    </>
  );
}

export default function MatchupsCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10">
          Loading...
        </main>
      }
    >
      <MatchupsCheckoutContent />
    </Suspense>
  );
}
