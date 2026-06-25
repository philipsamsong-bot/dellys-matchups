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

const countries = [
  "Cameroon",
  "Nigeria",
  "Ghana",
  "South Africa",
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Zambia",
  "Zimbabwe",
  "Ethiopia",
  "United Kingdom",
  "United States",
  "Canada",
  "France",
  "Germany",
  "Belgium",
  "Netherlands",
  "Italy",
  "Spain",
  "Ireland",
  "Switzerland",
  "Australia",
  "United Arab Emirates",
  "Qatar",
  "Saudi Arabia",
  "China",
  "India",
  "Brazil",
  "Other",
];

const countryDialCodes = {
  Cameroon: "+237",
  Nigeria: "+234",
  Ghana: "+233",
  "South Africa": "+27",
  Kenya: "+254",
  Uganda: "+256",
  Tanzania: "+255",
  Rwanda: "+250",
  Zambia: "+260",
  Zimbabwe: "+263",
  Ethiopia: "+251",
  "United Kingdom": "+44",
  "United States": "+1",
  Canada: "+1",
  France: "+33",
  Germany: "+49",
  Belgium: "+32",
  Netherlands: "+31",
  Italy: "+39",
  Spain: "+34",
  Ireland: "+353",
  Switzerland: "+41",
  Australia: "+61",
  "United Arab Emirates": "+971",
  Qatar: "+974",
  "Saudi Arabia": "+966",
  China: "+86",
  India: "+91",
  Brazil: "+55",
  Other: "",
};

const dialCodes = [...new Set(Object.values(countryDialCodes).filter(Boolean))];

const plans = {
  premium: {
    title: "Premium Membership",
    price: 30,
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
  country: "",
  postal_code: "",
  phone_code: "",
  phone: "",
  payment_method: "PayPal / Card",
  proof_url: "",
  notes: "",
};

function splitPhoneNumber(phone) {
  if (!phone) return { phone_code: "", phone: "" };

  const matchedCode = dialCodes
    .sort((a, b) => b.length - a.length)
    .find((code) => phone.startsWith(code));

  if (!matchedCode) return { phone_code: "", phone };

  return {
    phone_code: matchedCode,
    phone: phone.replace(matchedCode, "").trim(),
  };
}

function MatchupsCheckoutContent() {
  const searchParams = useSearchParams();
  const paypalRef = useRef(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const initialPlan = searchParams.get("plan") || "premium";

  const [userId, setUserId] = useState(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState(
    plans[initialPlan] ? initialPlan : "premium"
  );
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedPlan = plans[selectedPlanKey];

  useEffect(() => {
    async function loadUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email,phone,country,postal_code")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setForm((current) => ({
          ...current,
          customer_email: current.customer_email || user.email || "",
        }));
        return;
      }

      const phoneParts = splitPhoneNumber(profile.phone || "");

      setForm((current) => ({
        ...current,
        customer_name: current.customer_name || profile.full_name || "",
        customer_email: current.customer_email || profile.email || user.email || "",
        country: current.country || profile.country || "",
        postal_code: current.postal_code || profile.postal_code || "",
        phone_code:
          current.phone_code ||
          phoneParts.phone_code ||
          countryDialCodes[profile.country] ||
          "",
        phone: current.phone || phoneParts.phone || "",
      }));
    }

    loadUserProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "country") {
      setForm((current) => ({
        ...current,
        country: value,
        phone_code: countryDialCodes[value] || current.phone_code,
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  }

  function getFullPhone() {
    return `${form.phone_code}${form.phone.replace(/^0+/, "").trim()}`;
  }

  function validateForm() {
    if (!form.customer_name.trim()) {
      alert("Please enter your full name.");
      return false;
    }

    if (!form.customer_email.trim()) {
      alert("Please enter your email.");
      return false;
    }

    if (!form.country) {
      alert("Please select your country.");
      return false;
    }

    if (!form.postal_code.trim()) {
      alert("Please enter your postal / ZIP code.");
      return false;
    }

    if (!form.phone_code || !form.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }

    return true;
  }

  async function activateMembership() {
    if (!userId) {
      throw new Error("Unable to upgrade membership because no user is logged in.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        plan: selectedPlanKey,
        membership_plan: selectedPlanKey,
        subscription: selectedPlanKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, plan, membership_plan, subscription");

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      throw new Error("Payment was successful, but your profile could not be upgraded.");
    }
  }

  async function savePayment(status, providerReference = null) {
    const fullPhone = getFullPhone();

    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim().toLowerCase(),
      purpose: "membership",
      item_name: selectedPlan.title,
      amount: selectedPlan.price,
      currency: "USD",
      payment_method: form.payment_method,
      status,
      provider_reference: providerReference,
      proof_url: form.proof_url,
      notes: `Plan: ${selectedPlanKey}
Country: ${form.country}
Postal / ZIP Code: ${form.postal_code}
Phone: ${fullPhone}
${form.notes || ""}`,
    });

    if (error) throw new Error(error.message);
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
              return Promise.reject(new Error("Membership details incomplete."));
            }

            return actions.order.create({
              purchase_units: [
                {
                  description: `Delly's Matchups - ${selectedPlan.title}`,
                  amount: {
                    currency_code: "USD",
                    value: selectedPlan.price.toFixed(2),
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
                await activateMembership();
                alert("Membership payment successful. Your plan has been upgraded.");
                window.location.href = "/dashboard";
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
            console.error("PayPal Error:", error);
            alert("PayPal payment failed.");
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
    selectedPlanKey,
    selectedPlan.price,
    selectedPlan.title,
    form.customer_name,
    form.customer_email,
    form.country,
    form.postal_code,
    form.phone_code,
    form.phone,
    userId,
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
      alert("Your payment has been submitted and is pending admin confirmation.");
      window.location.href = "/dashboard";
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
                  <span className="ml-2 text-xl text-white">USD / month</span>
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {Object.entries(plans).map(([key, plan]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPlanKey(key)}
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

                    <h3 className="font-display mt-4 text-4xl font-bold">
                      {plan.title}
                    </h3>

                    <p className="mt-3 text-4xl font-black">${plan.price}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white placeholder:text-white/60"
                  required
                />

                <input
                  type="email"
                  name="customer_email"
                  value={form.customer_email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white placeholder:text-white/60"
                  required
                />

                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white md:col-span-2"
                  required
                >
                  <option value="" className="text-black">
                    Select your country
                  </option>
                  {countries.map((country) => (
                    <option key={country} value={country} className="text-black">
                      {country}
                    </option>
                  ))}
                </select>

                <input
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                  placeholder="Enter postal / ZIP code"
                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white placeholder:text-white/60"
                  required
                />

                <div className="flex h-16 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                  <select
                    name="phone_code"
                    value={form.phone_code}
                    onChange={handleChange}
                    className="w-28 bg-white/10 px-3 text-white outline-none"
                    required
                  >
                    <option value="" className="text-black">
                      Code
                    </option>
                    {dialCodes.map((code) => (
                      <option key={code} value={code} className="text-black">
                        {code}
                      </option>
                    ))}
                  </select>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone / WhatsApp number"
                    className="min-w-0 flex-1 bg-transparent px-4 text-white outline-none placeholder:text-white/60"
                    required
                  />
                </div>
              </div>

              <h3 className="font-display mt-10 text-4xl font-bold">
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
                      className={`rounded-2xl p-5 font-black ${
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

              {form.payment_method === "PayPal / Card" && (
                <div className="mt-8 rounded-2xl bg-white p-6 text-[#b30018]">
                  {!paypalClientId ? (
                    <p>Missing PayPal Client ID</p>
                  ) : (
                    <div ref={paypalRef} />
                  )}
                </div>
              )}

              {form.payment_method === "Mobile Money" && (
                <ManualPaymentBox
                  type="momo"
                  form={form}
                  mobileMoney={mobileMoney}
                  saving={saving}
                  uploading={uploading}
                  handleChange={handleChange}
                  handleProofUpload={handleProofUpload}
                  handleManualSubmit={handleManualSubmit}
                />
              )}

              {form.payment_method === "Bank Transfer" && (
                <ManualPaymentBox
                  type="bank"
                  form={form}
                  mobileMoney={mobileMoney}
                  saving={saving}
                  uploading={uploading}
                  handleChange={handleChange}
                  handleProofUpload={handleProofUpload}
                  handleManualSubmit={handleManualSubmit}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function ManualPaymentBox({
  type,
  form,
  mobileMoney,
  saving,
  uploading,
  handleChange,
  handleProofUpload,
  handleManualSubmit,
}) {
  const isMomo = type === "momo";

  return (
    <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {isMomo ? "MTN Mobile Money" : "Bank Transfer"}
      </p>

      {isMomo ? (
        <>
          <p className="mt-4 text-lg leading-8 text-white/80">
            Send your payment using the Mobile Money details below.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-5">
            <p className="text-white/70">Account Name</p>
            <p className="mt-1 text-2xl font-black">{mobileMoney.name}</p>
            <p className="mt-5 text-white/70">Mobile Money Number</p>
            <p className="mt-1 text-3xl font-black">{mobileMoney.number}</p>
          </div>
        </>
      ) : (
        <p className="mt-4 text-lg leading-8 text-white/80">
          Bank transfer details will be provided by Delly&apos;s Matchups. After
          payment, send your transaction proof on WhatsApp for confirmation.
        </p>
      )}

      <p className="mt-5 text-white/70">
        After payment, send your transaction ID or screenshot on WhatsApp for
        manual confirmation.
      </p>

      <textarea
        name="notes"
        value={form.notes}
        onChange={handleChange}
        rows="4"
        placeholder="Optional notes or transaction reference"
        className="mt-6 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white placeholder:text-white/60"
      />

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleProofUpload}
        className="mt-6 w-full"
      />

      {uploading && <p className="mt-3 text-sm text-white/70">Uploading...</p>}

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
          {isMomo ? "Send MoMo Proof" : "Send Bank Proof"}
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
  );
}

export default function MatchupsCheckoutPage() {
  return (
    <Suspense fallback={<main className="p-10">Loading...</main>}>
      <MatchupsCheckoutContent />
    </Suspense>
  );
}
