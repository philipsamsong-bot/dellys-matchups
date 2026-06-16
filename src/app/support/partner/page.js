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
  organization: "",
  partnership_type: "Monthly Support",
  amount: "",
  payment_method: "PayPal / Card",
  notes: "",
  proof_url: "",
};

export default function PartnerPage() {
  const paypalRef = useRef(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const formRef = useRef(emptyForm);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

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
      customer_name: currentForm.customer_name,
      customer_email: currentForm.customer_email,
      purpose: "partner",
      item_name: currentForm.partnership_type,
      amount: Number(currentForm.amount),
      currency: "USD",
      payment_method: currentForm.payment_method,
      status,
      provider_reference: providerReference,
      proof_url: currentForm.proof_url,
      notes: `Organization: ${currentForm.organization || "N/A"}\n\n${
        currentForm.notes || ""
      }`,
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
              return Promise.reject(
                new Error("Partnership payment details incomplete.")
              );
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    if (form.payment_method === "PayPal / Card") {
      alert("Please complete payment using the PayPal/Card button.");
      return;
    }

    setSaving(true);

    try {
      await savePayment("pending_confirmation");
      alert("Thank you. Your partnership support has been submitted.");
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
            {[
              "Monthly Support",
              "Project Partnership",
              "Corporate Partnership",
            ].map((item) => (
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
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-10 grid gap-6">
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
              type="text"
              name="organization"
              value={form.organization}
              onChange={handleChange}
              placeholder="Organization / company optional"
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Support amount in USD"
              min="1"
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none"
            >
              <option className="text-black">PayPal / Card</option>
              <option className="text-black">Mobile Money</option>
              <option className="text-black">Bank Transfer</option>
            </select>

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
              <div className="rounded-[2rem] bg-white/10 p-6">
                <h2 className="font-display text-3xl font-bold">
                  MTN Mobile Money
                </h2>

                <p className="mt-4 font-bold">
                  Account Name: {mobileMoney.name}
                </p>

                <p className="mt-2 text-3xl font-black">
                  {mobileMoney.number}
                </p>

                <a
                  href={mobileMoney.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
                >
                  Send Payment Proof
                </a>
              </div>
            )}

            {form.payment_method === "Bank Transfer" && (
              <div className="rounded-[2rem] bg-white/10 p-6">
                <h2 className="font-display text-3xl font-bold">
                  Bank Transfer
                </h2>

                <p className="mt-4 text-white/75">
                  Make your transfer using the official bank details provided by
                  Delly&apos;s Matchups, then upload your payment proof below.
                </p>
              </div>
            )}

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="5"
              placeholder="Tell us how you would like to partner..."
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            {form.payment_method !== "PayPal / Card" && (
              <div className="rounded-[2rem] bg-white/10 p-6">
                <p className="font-black">Upload payment proof</p>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofUpload}
                  className="mt-4 w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
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
              </div>
            )}

            {form.payment_method !== "PayPal / Card" && (
              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] disabled:opacity-60"
              >
                {saving ? "Submitting..." : "Submit Partnership Support"}
              </button>
            )}
          </form>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
