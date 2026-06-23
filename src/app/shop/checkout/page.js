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

const emptyForm = {
  customer_name: "",
  customer_email: "",
  country: "",
  postal_code: "",
  phone: "",
  payment_method: "PayPal / Card",
  proof_url: "",
  notes: "",
};

function ShopCheckoutContent() {
  const searchParams = useSearchParams();
  const paypalRef = useRef(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const product = searchParams.get("product") || "Shop Items";
  const category = searchParams.get("category") || "Shop";
  const price = Number(searchParams.get("price") || 0);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email,phone,country,postal_code")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      setForm((current) => ({
        ...current,
        customer_name: current.customer_name || profile.full_name || "",
        customer_email: current.customer_email || profile.email || user.email || "",
        country: current.country || profile.country || "",
        postal_code: current.postal_code || profile.postal_code || "",
        phone: current.phone || profile.phone || "",
      }));
    }

    loadUserProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    if (!form.customer_name.trim() || !form.customer_email.trim()) {
      alert("Please enter your full name and email address.");
      return false;
    }

    if (!price || price <= 0) {
      alert("Invalid shop order amount.");
      return false;
    }

    return true;
  }

  async function savePayment(status, providerReference = null) {
    const { error } = await supabase.from("payments").insert({
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim().toLowerCase(),
      purpose: "shop",
      item_name: product,
      amount: price,
      currency: "USD",
      payment_method: form.payment_method,
      status,
      provider_reference: providerReference,
      proof_url: form.proof_url,
      notes: `Category: ${category}
Country: ${form.country}
Postal / ZIP Code: ${form.postal_code}
Phone: ${form.phone}

${form.notes || ""}`,
    });

    if (error) throw new Error(error.message);
  }

  useEffect(() => {
    if (
      form.payment_method !== "PayPal / Card" ||
      !paypalClientId ||
      !paypalRef.current ||
      !form.customer_name.trim() ||
      !form.customer_email.trim() ||
      !price ||
      price <= 0
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
            if (!validateForm()) {
              return actions.reject();
            }

            return actions.order.create({
              purchase_units: [
                {
                  description: `Delly's Matchups Shop - ${product}`,
                  amount: {
                    currency_code: "USD",
                    value: price.toFixed(2),
                  },
                },
              ],
            });
          },
          onApprove(data, actions) {
            return actions.order.capture().then(async () => {
              try {
                setSaving(true);
                await savePayment("paid", data.orderID);
                alert("Payment successful. Your shop order has been submitted.");
                window.location.href = "/shop/payment-success";
              } catch (error) {
                alert(error.message);
              } finally {
                setSaving(false);
              }
            });
          },
          onCancel() {
            alert("Payment cancelled.");
          },
          onError(error) {
            console.error("PayPal SDK error:", error);
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
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = renderButtons;
    document.body.appendChild(script);
  }, [
    paypalClientId,
    form.payment_method,
    form.customer_name,
    form.customer_email,
    product,
    price,
  ]);

  async function handleProofUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `payment-proofs/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("content-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      setUploading(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("content-images")
      .getPublicUrl(fileName);

    setForm((current) => ({ ...current, proof_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleManualSubmit() {
    if (!validateForm()) return;

    try {
      setSaving(true);
      await savePayment("pending_confirmation");
      alert(
        "Your payment choice has been submitted. Please send proof on WhatsApp for confirmation."
      );
      window.location.href = "/shop/payment-pending";
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SiteNav />

      <main
        className="relative min-h-screen bg-[#b30018] bg-cover bg-center bg-no-repeat px-6 pb-24 pt-44 text-white"
        style={{ backgroundImage: "url('/delly-usa.jpg')" }}
      >
        <div className="absolute inset-0 bg-[#5a000a]/75" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#b30018]/90 via-[#b30018]/65 to-black/75" />

        <section className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-5xl rounded-[3rem] border border-yellow-300/30 bg-black/35 p-8 shadow-2xl backdrop-blur-xl md:p-12">
            <p className="font-black uppercase tracking-[0.35em] text-yellow-300">
              Delly&apos;s Matchups Shop
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
              Complete Your Order
            </h1>

            <div className="mt-10 rounded-[2rem] border border-yellow-300/40 bg-white p-7 text-[#b30018] shadow-2xl">
              <p className="font-black uppercase tracking-[0.25em]">
                Order Summary
              </p>

              <h2 className="font-display mt-5 text-4xl font-bold">
                {product}
              </h2>

              <p className="mt-3 text-black/70">{category}</p>

              <p className="mt-5 text-5xl font-black">
                ${price.toFixed(2)}
                <span className="ml-2 text-lg uppercase tracking-[0.2em]">
                  USD
                </span>
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Full name"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                type="email"
                name="customer_email"
                value={form.customer_email}
                onChange={handleChange}
                placeholder="Email address"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
              />

              <input
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                placeholder="Postal / ZIP Code"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />
            </div>

            <div className="mt-10">
              <h3 className="font-display text-4xl font-bold">
                Payment Method
              </h3>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {["PayPal / Card", "Mobile Money", "Bank Transfer"].map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          payment_method: method,
                        }))
                      }
                      className={`rounded-2xl p-6 font-black transition hover:scale-105 ${
                        form.payment_method === method
                          ? "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black"
                          : "bg-white text-[#b30018]"
                      }`}
                    >
                      {method}
                    </button>
                  )
                )}
              </div>
            </div>

            {form.payment_method === "PayPal / Card" && (
              <div className="mt-8 rounded-[2rem] bg-white p-6 text-[#b30018]">
                {!paypalClientId ? (
                  <p className="font-bold">
                    Missing PayPal Client ID. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID
                    to .env.local.
                  </p>
                ) : !form.customer_name.trim() || !form.customer_email.trim() ? (
                  <p className="font-bold">
                    Enter your full name and email address first, then PayPal
                    will appear.
                  </p>
                ) : (
                  <div ref={paypalRef} />
                )}
              </div>
            )}

            {form.payment_method === "Mobile Money" && (
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

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Optional note, address, delivery information, or transaction reference"
                  className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofUpload}
                  className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
                />

                {uploading && (
                  <p className="mt-3 text-sm text-white/70">
                    Uploading proof...
                  </p>
                )}

                {form.proof_url && (
                  <p className="mt-3 text-sm font-bold text-white">
                    Payment proof uploaded.
                  </p>
                )}

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
                    onClick={handleManualSubmit}
                    disabled={saving || uploading}
                    className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20 disabled:opacity-60"
                  >
                    {saving ? "Submitting..." : "I Have Paid"}
                  </button>
                </div>
              </div>
            )}

            {form.payment_method === "Bank Transfer" && (
              <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                  Bank Transfer
                </p>

                <p className="mt-4 text-lg leading-8 text-white/80">
                  Bank transfer details will be provided by Delly&apos;s
                  Matchups. After payment, send your transaction proof on
                  WhatsApp for confirmation.
                </p>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Optional note, address, delivery information, or transaction reference"
                  className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofUpload}
                  className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
                />

                {uploading && (
                  <p className="mt-3 text-sm text-white/70">
                    Uploading proof...
                  </p>
                )}

                {form.proof_url && (
                  <p className="mt-3 text-sm font-bold text-white">
                    Payment proof uploaded.
                  </p>
                )}

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
                    onClick={handleManualSubmit}
                    disabled={saving || uploading}
                    className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20 disabled:opacity-60"
                  >
                    {saving ? "Submitting..." : "I Have Paid"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default function ShopCheckoutPage() {
  return (
    <Suspense fallback={<main className="p-10">Loading...</main>}>
      <ShopCheckoutContent />
    </Suspense>
  );
}
