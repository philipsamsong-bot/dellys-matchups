// src/app/matchups/checkout/page.js

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/components/SiteChrome";
import {
  buildCountryOptions,
  getDialCodeForCountry,
  getDialCodes,
  splitPhoneNumber,
} from "@/lib/countries";
import { supabase } from "@/lib/supabase";

const mobileMoney = {
  name: "Victorine Ncham",
  number: "+237 676 25 71 87",
  whatsapp: "https://wa.me/237676257187",
};

const bankTransfer = {
  accountName: "DELLY'S MATCHUPS LTD",
  bankName: "Lloyds Bank",
  sortCode: "30-54-66",
  accountNumber: "22464963",
  iban: "GB23LOYD30546622464963",
  bic: "LOYDGB21F95",
};

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
  phone_code: "",
  phone: "",
  payment_method: "PayPal / Card",
  provider_reference: "",
  proof_url: "",
  notes: "",
};

function MatchupsCheckoutContent() {
  const searchParams = useSearchParams();

  const countryOptions = useMemo(buildCountryOptions, []);
  const dialCodes = useMemo(
    () => getDialCodes(countryOptions),
    [countryOptions],
  );

  const initialPlan = searchParams.get("plan") || "premium";

  const [userId, setUserId] = useState(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState(
    plans[initialPlan] ? initialPlan : "premium",
  );
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedPlan = plans[selectedPlanKey];

  useEffect(() => {
    async function loadUserProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("AUTH USER ERROR:", userError);
      }

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name,email,phone,country")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("PROFILE LOAD ERROR:", error);
      }

      if (!profile) {
        setForm((current) => ({
          ...current,
          customer_email:
            current.customer_email || user.email || "",
        }));
        return;
      }

      const phoneParts = splitPhoneNumber(
        profile.phone || "",
        dialCodes,
      );

      const countryDialCode = getDialCodeForCountry(
        profile.country,
        countryOptions,
      );

      setForm((current) => ({
        ...current,
        customer_name:
          current.customer_name || profile.full_name || "",
        customer_email:
          current.customer_email ||
          profile.email ||
          user.email ||
          "",
        country: current.country || profile.country || "",
        phone_code:
          current.phone_code ||
          phoneParts.phone_code ||
          countryDialCode ||
          "",
        phone: current.phone || phoneParts.phone || "",
      }));
    }

    void loadUserProfile();
  }, [countryOptions, dialCodes]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "country") {
      const dialCode = getDialCodeForCountry(
        value,
        countryOptions,
      );

      setForm((current) => ({
        ...current,
        country: value,
        phone_code: dialCode || current.phone_code,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function getFullPhone() {
    const localPhone = String(form.phone || "")
      .replace(/[^\d]/g, "")
      .replace(/^0+/, "");

    return `${form.phone_code}${localPhone}`;
  }

  function validateContactForm() {
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

    if (!form.phone_code || !form.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }

    return true;
  }

  function validateManualPayment() {
    if (!validateContactForm()) {
      return false;
    }

    if (!form.provider_reference.trim()) {
      alert(
        "Please enter the transaction or payment reference.",
      );
      return false;
    }

    return true;
  }

  async function getAuthenticatedSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      window.location.href = "/auth/login";
      return null;
    }

    return session;
  }

  async function handlePayPalSubscription() {
    if (!validateContactForm()) {
      return;
    }

    try {
      setSaving(true);

      const session = await getAuthenticatedSession();

      if (!session) {
        return;
      }

      const response = await fetch(
        "/api/paypal/subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            plan: selectedPlanKey,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start PayPal subscription.",
        );
      }

      if (!data.url) {
        throw new Error(
          "PayPal approval URL was not returned.",
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(
        "PAYPAL SUBSCRIPTION ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to start PayPal subscription.",
      );

      setSaving(false);
    }
  }

  async function submitManualPayment() {
    const session = await getAuthenticatedSession();

    if (!session) {
      return null;
    }

    const response = await fetch(
      "/api/matchups/manual-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: selectedPlanKey,
          paymentMethod: form.payment_method,
          customerName: form.customer_name.trim(),
          customerEmail: form.customer_email
            .trim()
            .toLowerCase(),
          country: form.country,
          phone: getFullPhone(),
          providerReference:
            form.provider_reference.trim(),
          proofUrl: form.proof_url || null,
          notes: form.notes.trim(),
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to submit payment.",
      );
    }

    return data;
  }

  async function handleProofUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!userId) {
      alert(
        "Please sign in before uploading payment proof.",
      );
      return;
    }

    setUploading(true);

    try {
      const fileExtension =
        file.name.split(".").pop() || "file";

      const safeExtension =
        fileExtension
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase() || "file";

      const uniqueId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const fileName =
        `payment-proofs/${userId}/` +
        `${Date.now()}-${uniqueId}.${safeExtension}`;

      const { error } = await supabase.storage
        .from("content-images")
        .upload(fileName, file, {
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from("content-images")
        .getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error(
          "Unable to create payment proof URL.",
        );
      }

      setForm((current) => ({
        ...current,
        proof_url: data.publicUrl,
      }));
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to upload payment proof.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleManualSubmit() {
    if (!validateManualPayment()) {
      return;
    }

    try {
      setSaving(true);

      const result = await submitManualPayment();

      if (!result) {
        return;
      }

      if (result.duplicate) {
        alert(
          result.message ||
            "This payment has already been submitted.",
        );
      } else {
        alert(
          result.message ||
            "Your payment has been submitted and is pending admin confirmation. Your membership will be activated after the payment is verified.",
        );
      }

      window.location.href = "/dashboard";
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit payment.",
      );
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
                        setSelectedPlanKey(key)
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

                      <h3 className="font-display mt-4 text-4xl font-bold">
                        {plan.title}
                      </h3>

                      <p className="mt-3 text-4xl font-black">
                        ${plan.price}
                      </p>
                    </button>
                  ),
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
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white placeholder:text-white/60"
                  required
                />

                <input
                  type="email"
                  name="customer_email"
                  value={form.customer_email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  autoComplete="email"
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
                  <option
                    value=""
                    className="text-black"
                  >
                    Select your country
                  </option>

                  {countryOptions.map(
                    (country) => (
                      <option
                        key={country.isoCode}
                        value={country.name}
                        className="text-black"
                      >
                        {country.name}
                      </option>
                    ),
                  )}

                  <option
                    value="Other"
                    className="text-black"
                  >
                    Other
                  </option>
                </select>

                <div className="flex h-16 overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:col-span-2">
                  <select
                    name="phone_code"
                    value={form.phone_code}
                    onChange={handleChange}
                    className="w-32 bg-white/10 px-3 text-white outline-none"
                    required
                  >
                    <option
                      value=""
                      className="text-black"
                    >
                      Code
                    </option>

                    {dialCodes.map((code) => (
                      <option
                        key={code}
                        value={code}
                        className="text-black"
                      >
                        {code}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel-national"
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
                        payment_method: method,
                        provider_reference: "",
                        proof_url: "",
                        notes: "",
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
                ))}
              </div>

              {form.payment_method ===
                "PayPal / Card" && (
                <div className="mt-8 rounded-[2rem] bg-white p-7 text-[#b30018]">
                  <p className="text-sm font-black uppercase tracking-[0.25em]">
                    Recurring Membership
                  </p>

                  <h4 className="font-display mt-3 text-3xl font-bold">
                    Continue with PayPal
                  </h4>

                  <p className="mt-4 leading-7 text-black/70">
                    PayPal will securely set up your{" "}
                    {selectedPlan.title} at $
                    {selectedPlan.price} USD per month.
                    Your membership is managed
                    automatically while your
                    subscription remains active.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handlePayPalSubscription
                    }
                    disabled={saving}
                    className="mt-7 w-full rounded-full bg-[#ffc439] px-8 py-4 text-lg font-black text-[#111] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Opening PayPal..."
                      : `Subscribe with PayPal — $${selectedPlan.price}/month`}
                  </button>
                </div>
              )}

              {form.payment_method ===
                "Mobile Money" && (
                <ManualPaymentBox
                  type="momo"
                  form={form}
                  mobileMoney={mobileMoney}
                  bankTransfer={bankTransfer}
                  saving={saving}
                  uploading={uploading}
                  handleChange={handleChange}
                  handleProofUpload={
                    handleProofUpload
                  }
                  handleManualSubmit={
                    handleManualSubmit
                  }
                />
              )}

              {form.payment_method ===
                "Bank Transfer" && (
                <ManualPaymentBox
                  type="bank"
                  form={form}
                  mobileMoney={mobileMoney}
                  bankTransfer={bankTransfer}
                  saving={saving}
                  uploading={uploading}
                  handleChange={handleChange}
                  handleProofUpload={
                    handleProofUpload
                  }
                  handleManualSubmit={
                    handleManualSubmit
                  }
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
  bankTransfer,
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
        {isMomo
          ? "MTN Mobile Money"
          : "Bank Transfer"}
      </p>

      {isMomo ? (
        <>
          <p className="mt-4 text-lg leading-8 text-white/80">
            Send your membership payment using
            the Mobile Money details below.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-5">
            <p className="text-white/70">
              Account Name
            </p>
            <p className="mt-1 text-2xl font-black">
              {mobileMoney.name}
            </p>

            <p className="mt-5 text-white/70">
              Mobile Money Number
            </p>
            <p className="mt-1 text-3xl font-black">
              {mobileMoney.number}
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-lg leading-8 text-white/80">
            Send your membership payment using
            the bank details below.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-5">
            <p className="text-white/70">
              Account Name
            </p>
            <p className="mt-1 text-xl font-black">
              {bankTransfer.accountName}
            </p>

            <p className="mt-5 text-white/70">
              Bank
            </p>
            <p className="mt-1 text-xl font-black">
              {bankTransfer.bankName}
            </p>

            <p className="mt-5 text-white/70">
              Sort Code
            </p>
            <p className="mt-1 text-xl font-black">
              {bankTransfer.sortCode}
            </p>

            <p className="mt-5 text-white/70">
              Account Number
            </p>
            <p className="mt-1 text-xl font-black">
              {bankTransfer.accountNumber}
            </p>

            <p className="mt-5 text-white/70">
              IBAN
            </p>
            <p className="mt-1 break-all text-xl font-black">
              {bankTransfer.iban}
            </p>

            <p className="mt-5 text-white/70">
              BIC
            </p>
            <p className="mt-1 text-xl font-black">
              {bankTransfer.bic}
            </p>
          </div>
        </>
      )}

      <p className="mt-6 text-white/80">
        After sending the payment, enter the
        transaction reference below. Your
        membership will be activated after the
        payment has been manually verified.
      </p>

      <input
        type="text"
        name="provider_reference"
        value={form.provider_reference}
        onChange={handleChange}
        placeholder="Transaction / payment reference"
        className="mt-6 h-16 w-full rounded-2xl border border-white/10 bg-white/10 px-5 text-white placeholder:text-white/60"
        required
      />

      <textarea
        name="notes"
        value={form.notes}
        onChange={handleChange}
        rows={4}
        placeholder="Optional payment notes"
        className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white placeholder:text-white/60"
      />

      <div className="mt-6">
        <p className="mb-3 font-bold">
          Payment proof
          <span className="ml-2 font-normal text-white/60">
            Optional
          </span>
        </p>

        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleProofUpload}
          className="w-full"
        />

        {uploading ? (
          <p className="mt-3 text-sm text-white/70">
            Uploading...
          </p>
        ) : null}

        {form.proof_url ? (
          <p className="mt-3 text-sm font-bold text-white">
            Payment proof uploaded.
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <a
          href={mobileMoney.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
        >
          {isMomo
            ? "Send MoMo Proof"
            : "Send Bank Proof"}
        </a>

        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={saving || uploading}
          className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Submitting..."
            : "Submit Payment for Verification"}
        </button>
      </div>
    </div>
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
