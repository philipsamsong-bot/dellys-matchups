"use client";

import { useEffect, useRef, useState } from "react";
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
  organization: "",
  partnership_type: "Monthly Support",
  amount: "",
  payment_method: "PayPal / Card",
  notes: "",
  proof_url: "",
};

export default function PartnerPage() {
  const paypalRef = useRef(null);
  const formRef = useRef(emptyForm);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

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

  function validateForm(currentForm = formRef.current) {
    if (
      !currentForm.customer_name.trim() ||
      !currentForm.customer_email.trim() ||
      !currentForm.amount ||
      Number(currentForm.amount) <= 0
    ) {
      alert("Please enter your name, email, and support amount.");
      return false;
    }

    return true;
  }

  async function savePayment(status, providerReference = null) {
    const currentForm = formRef.current;

    const { error } = await supabase.from("payments").insert({
      customer_name: currentForm.customer_name.trim(),
      customer_email: currentForm.customer_email.trim().toLowerCase(),
      purpose: "partner",
      item_name: currentForm.partnership_type,
      amount: Number(currentForm.amount),
      currency: "USD",
      payment_method: currentForm.payment_method,
      status,
      provider_reference: providerReference,
      proof_url: currentForm.proof_url,
      notes: `Organization: ${currentForm.organization || "N/A"}
Country: ${currentForm.country}
Postal / ZIP Code: ${currentForm.postal_code}
Phone: ${currentForm.phone}

${currentForm.notes || ""}`,
    });

    if (error) throw new Error(error.message);
  }

  useEffect(() => {
    if (
      form.payment_method !== "PayPal / Card" ||
      !paypalClientId ||
      !paypalRef.current ||
      !form.amount ||
      Number(form.amount) <= 0
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
            const currentForm = formRef.current;

            if (!validateForm(currentForm)) {
              return actions.reject();
            }

            return actions.order.create({
              purchase_units: [
                {
                  description: `Delly's Matchups - ${currentForm.partnership_type}`,
                  amount: {
                    currency_code: "USD",
                    value: Number(currentForm.amount).toFixed(2),
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
                alert("Thank you. Your partnership payment was successful.");
                setForm(emptyForm);
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
            console.error("PayPal payment failed:", error);
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
  }, [paypalClientId, form.payment_method, form.amount]);

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
      setForm(emptyForm);
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
        <section className="mx-auto max-w-5xl rounded-[3rem] bg-black/25 p-10 shadow-2xl md:p-16">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.35em] text-red-100">
              Support
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold">
              Become a Partner
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Partner with Delly&apos;s Matchups to support relationship
              education, counselling, matchmaking, community growth, and
              life-changing conversations.
            </p>
          </div>

          <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
            {["Monthly Support", "Project Partnership", "Corporate Partnership"].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      partnership_type: item,
                    }))
                  }
                  className={`rounded-[2rem] p-6 text-left transition ${
                    form.partnership_type === item
                      ? "bg-white text-[#b30018]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <h2 className="font-black">{item}</h2>
                  <p className="mt-3 text-sm opacity-75">
                    {item === "Monthly Support"
                      ? "Give consistently to support the mission."
                      : item === "Project Partnership"
                        ? "Support events, content, outreach, and community programs."
                        : "Collaborate with Delly's Matchups as an organization."}
                  </p>
                </button>
              )
            )}
          </div>

          <form onSubmit={(event) => event.preventDefault()} className="mt-10 grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Full name"
                className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              />

              <input
                type="email"
                name="customer_email"
                value={form.customer_email}
                onChange={handleChange}
                placeholder="Email address"
                className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              />

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
                className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 md:col-span-2"
              />

              <input
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                placeholder="Postal / ZIP Code"
                className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
              />

              <input
                type="text"
                name="organization"
                value={form.organization}
                onChange={handleChange}
                placeholder="Organization / company optional"
                className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50 md:col-span-2"
              />
            </div>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Support amount in USD"
              min="1"
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <div>
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
              <div className="rounded-[2rem] bg-white p-6 text-[#b30018]">
                {!paypalClientId ? (
                  <p className="font-bold">
                    Missing PayPal Client ID. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID
                    to .env.local.
                  </p>
                ) : !form.amount || Number(form.amount) <= 0 ? (
                  <p className="font-bold">
                    Enter your support amount first, then PayPal/Card options
                    will appear.
                  </p>
                ) : (
                  <div ref={paypalRef} />
                )}
              </div>
            )}

            {form.payment_method === "Mobile Money" && (
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                  MTN Mobile Money
                </p>

                <p className="mt-4 text-lg leading-8 text-white/80">
                  Send your payment using the Mobile Money details below.
                </p>

                <div className="mt-5 rounded-2xl bg-black/20 p-5">
                  <p className="text-white/70">Account Name</p>
                  <p className="mt-1 text-2xl font-black">{mobileMoney.name}</p>

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
                  rows="5"
                  placeholder="Tell us how you would like to partner, or add your transaction reference..."
                  className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
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
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6">
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
                  rows="5"
                  placeholder="Tell us how you would like to partner, or add your transaction reference..."
                  className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
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
          </form>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
