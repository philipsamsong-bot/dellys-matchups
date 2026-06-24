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

const courses = {
  "full-academy": {
    title: "Full Academy Programme",
    price: 297,
    description: "Access all 7 academy modules.",
  },
  "module-1": { title: "Module 1: Counselling 101", price: 50 },
  "module-2": { title: "Module 2: Counselling 102", price: 50 },
  "module-3": { title: "Module 3: Counselling 103", price: 50 },
  "module-4": { title: "Module 4: Leadership & Influence", price: 50 },
  "module-5": { title: "Module 5: Healing & Restoration", price: 50 },
  "module-6": { title: "Module 6: Master Classes", price: 50 },
  "module-7": { title: "Module 7: Virginity 101", price: 50 },
};

const moduleOptions = Object.entries(courses).filter(
  ([key]) => key !== "full-academy"
);

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

function AcademyCheckoutContent() {
  const searchParams = useSearchParams();
  const paypalRef = useRef(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const initialCourse = searchParams.get("course") || "full-academy";

  const [selectedCourseKey, setSelectedCourseKey] = useState(
    courses[initialCourse] ? initialCourse : "full-academy"
  );
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedCourse = courses[selectedCourseKey];

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
    if (!form.customer_name.trim() || !form.customer_email.trim()) {
      alert("Please enter your full name and email address.");
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

  async function activateAcademyEnrollment(paymentId) {
    const { error } = await supabase.from("academy_enrollments").upsert(
      {
        user_email: form.customer_email.trim().toLowerCase(),
        customer_name: form.customer_name.trim(),
        course_key: selectedCourseKey,
        course_title: selectedCourse.title,
        access_type: selectedCourseKey === "full-academy" ? "full" : "single",
        payment_id: paymentId,
        status: "active",
      },
      {
        onConflict: "user_email,course_key",
      }
    );

    if (error) throw new Error(error.message);
  }

  async function savePayment(status, providerReference = null) {
    const fullPhone = getFullPhone();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim().toLowerCase(),
        purpose: "academy",
        item_name: selectedCourse.title,
        amount: selectedCourse.price,
        currency: "USD",
        payment_method: form.payment_method,
        status,
        provider_reference: providerReference,
        proof_url: form.proof_url,
        notes: `Course Key: ${selectedCourseKey}
Country: ${form.country}
Postal / ZIP Code: ${form.postal_code}
Phone: ${fullPhone}

${form.notes || ""}`,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return data.id;
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
              return actions.reject();
            }

            return actions.order.create({
              purchase_units: [
                {
                  description: `Delly's Matchups Academy - ${selectedCourse.title}`,
                  amount: {
                    currency_code: "USD",
                    value: selectedCourse.price.toFixed(2),
                  },
                },
              ],
            });
          },
          onApprove(data, actions) {
            return actions.order.capture().then(async () => {
              try {
                setSaving(true);
                const paymentId = await savePayment("paid", data.orderID);
                await activateAcademyEnrollment(paymentId);
                alert("Payment successful. Your academy access has been unlocked.");
                window.location.href = `/academy/payment-success?course=${selectedCourseKey}`;
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
  }, [
    paypalClientId,
    form.payment_method,
    selectedCourseKey,
    selectedCourse.price,
    selectedCourse.title,
    form.customer_name,
    form.customer_email,
    form.country,
    form.postal_code,
    form.phone_code,
    form.phone,
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
        "Your payment has been submitted and is pending admin confirmation."
      );
      window.location.href = `/academy/payment-pending?course=${selectedCourseKey}`;
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
              Delly&apos;s Matchups Academy
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
              Academy Enrollment
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85">
              Choose between enrolling in the complete Academy Programme or
              purchasing an individual module.
            </p>

            <div className="mt-10 rounded-[2rem] border border-yellow-300/40 bg-white p-7 text-[#b30018] shadow-2xl">
              <h2 className="font-display text-4xl font-bold">
                {selectedCourse.title}
              </h2>
              <p className="mt-3 text-black/70">
                {selectedCourse.description || "Enroll in this academy module."}
              </p>
              <p className="mt-5 text-5xl font-black">
                ${selectedCourse.price}
                <span className="ml-2 text-lg uppercase tracking-[0.2em]">
                  USD
                </span>
              </p>
            </div>

            <div className="mt-10">
              <h3 className="font-display text-4xl font-bold">
                Choose Enrollment
              </h3>

              <button
                type="button"
                onClick={() => setSelectedCourseKey("full-academy")}
                className={`mt-6 w-full rounded-2xl border p-5 text-left font-black transition hover:scale-[1.01] ${
                  selectedCourseKey === "full-academy"
                    ? "border-yellow-300 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-xl"
                    : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Full Academy Programme — $297 USD
              </button>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {moduleOptions.map(([key, course]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCourseKey(key)}
                    className={`rounded-2xl border p-5 text-left font-black transition hover:scale-[1.01] ${
                      selectedCourseKey === key
                        ? "border-yellow-300 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-black shadow-xl"
                        : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {course.title} — ${course.price} USD
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                required
              />

              <input
                type="email"
                name="customer_email"
                value={form.customer_email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                required
              />

              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none md:col-span-2"
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
                className="h-16 rounded-2xl bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                required
              />

              <div className="flex h-16 overflow-hidden rounded-2xl bg-white/10">
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
        placeholder="Optional note or transaction reference"
        className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/60"
      />

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleProofUpload}
        className="mt-6 w-full rounded-2xl bg-white/10 px-5 py-4 text-white"
      />

      {uploading && (
        <p className="mt-3 text-sm text-white/70">Uploading proof...</p>
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

export default function AcademyCheckoutPage() {
  return (
    <Suspense fallback={<main className="p-10">Loading...</main>}>
      <AcademyCheckoutContent />
    </Suspense>
  );
}
