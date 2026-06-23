"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const services = {
  premarital: "Premarital Counselling",
  marital: "Marital Counselling",
  "purpose-discovery": "Purpose Discovery",
  "mentoring-coaching": "Mentoring & Coaching",
  healing: "Emotional Healing",
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

const maxWords = 300;

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function FieldLabel({ label, helper }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-red-100">
        {label}
      </p>
      {helper && <p className="mb-3 text-sm text-white/65">{helper}</p>}
    </div>
  );
}

function BookingForm() {
  const searchParams = useSearchParams();
  const selectedService = searchParams.get("service") || "premarital";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    country: "",
    postalCode: "",
    phone: "",
    service: services[selectedService] || "Premarital Counselling",
    relationshipStatus: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
    acceptedTerms: false,
  });

  const wordsUsed = useMemo(() => countWords(form.message), [form.message]);

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
        fullName: current.fullName || profile.full_name || "",
        email: current.email || profile.email || user.email || "",
        country: current.country || profile.country || "",
        postalCode: current.postalCode || profile.postal_code || "",
        phone: current.phone || profile.phone || "",
      }));
    }

    loadUserProfile();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    if (name === "message" && countWords(value) > maxWords) return;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.acceptedTerms) {
      alert("Please accept the terms and conditions before continuing.");
      return;
    }

    const bookingId = crypto.randomUUID();

    const { error } = await supabase.from("counselling_bookings").insert({
      id: bookingId,
      full_name: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      country: form.country,
      postal_code: form.postalCode.trim(),
      phone: form.phone.trim(),
      service: form.service,
      relationship_status: form.relationshipStatus,
      preferred_date: form.preferredDate,
      preferred_time: form.preferredTime,
      message: form.message.trim(),
      accepted_terms: form.acceptedTerms,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = `/counselling/payment?booking=${bookingId}`;
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-4 pb-24 pt-36 text-white sm:px-6 lg:pt-44">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
              Counselling Booking
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl md:text-8xl">
              Begin Your Healing Journey
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/80">
              Fill this form carefully. Your information will be treated with
              confidentiality, empathy, and respect.
            </p>
          </motion.div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-12 rounded-[2rem] bg-[#c1121f] p-5 shadow-2xl sm:p-8 md:mt-16 md:rounded-[3rem] md:p-12"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                required
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none md:col-span-2"
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
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                required
                placeholder="Enter postal / ZIP code"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="Enter phone / WhatsApp number"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                required
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
              >
                {Object.values(services).map((service) => (
                  <option key={service} value={service} className="text-black">
                    {service}
                  </option>
                ))}
              </select>

              <select
                name="relationshipStatus"
                value={form.relationshipStatus}
                onChange={handleChange}
                required
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
              >
                <option value="" className="text-black">
                  Select relationship status
                </option>
                <option className="text-black">Single</option>
                <option className="text-black">Dating</option>
                <option className="text-black">Engaged</option>
                <option className="text-black">Married</option>
                <option className="text-black">Separated</option>
                <option className="text-black">Prefer not to say</option>
              </select>

              <div>
                <FieldLabel
                  label="Preferred Counselling Date"
                  helper="Select the date you would prefer for your counselling session."
                />
                <input
                  type="date"
                  name="preferredDate"
                  value={form.preferredDate}
                  onChange={handleChange}
                  required
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                />
              </div>

              <div>
                <FieldLabel
                  label="Preferred Counselling Time"
                  helper="Select the time you would prefer for your counselling session."
                />
                <input
                  type="time"
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleChange}
                  required
                  className="h-16 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel
                  label="Counselling Request"
                  helper={`Briefly describe what you need help with. Maximum ${maxWords} words.`}
                />
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="Example: I need guidance concerning my relationship, healing, marriage, purpose, or emotional wellbeing..."
                  className="min-h-44 w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60"
                />
                <p className="mt-2 text-right text-sm text-white/70">
                  {wordsUsed}/{maxWords} words
                </p>
              </div>
            </div>

            <div className="mt-8 max-h-[500px] overflow-y-auto rounded-2xl bg-white/10 p-6 text-sm leading-7 text-white">
              <h3 className="mb-4 text-xl font-bold">
                Counselling Session Terms & Conditions
              </h3>

              <p className="mb-6 font-semibold">
                Delly&apos;s Matchups (DMs) & Delly&apos;s Mentoring Academy
              </p>

              <p className="mb-6">
                By booking a counselling, mentorship, coaching, or consultation
                session with DMs, you acknowledge that you have read,
                understood, and agreed to the counselling terms and conditions.
              </p>

              <ul className="ml-6 list-disc space-y-3">
                <li>Sessions provide emotional support, relationship guidance, mentorship, coaching, and faith-based counselling.</li>
                <li>Sessions do not replace licensed psychiatric, medical, legal, or emergency mental health services.</li>
                <li>Standard counselling sessions last one hour unless otherwise agreed.</li>
                <li>Full payment must be made before a session is confirmed.</li>
                <li>Payments are non-refundable except where DMs is responsible for the session not taking place.</li>
                <li>Rescheduling should be requested at least 24 hours before the appointment.</li>
                <li>Disrespect, harassment, threats, insults, or abuse toward staff are not permitted.</li>
                <li>Sessions are handled with confidentiality and professionalism.</li>
                <li>Clients are responsible for honesty, accountability, and willingness to implement guidance.</li>
                <li>Clients must not secretly record sessions without prior consent.</li>
              </ul>

              <p className="mt-8 text-center font-bold">
                Delly&apos;s Matchups (DMs)
              </p>

              <p className="text-center italic">
                Redefining Authentic Relationships
              </p>
            </div>

            <label className="mt-8 flex gap-4 text-left">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                className="mt-1 h-6 w-6 shrink-0"
              />

              <span className="text-sm leading-7 text-white/85">
                I confirm that I have carefully read, understood, and accepted
                the counselling session terms and conditions of Delly&apos;s
                Matchups (DMs).
              </span>
            </label>

            <button
              type="submit"
              className="mt-10 w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
            >
              Submit Booking Request
            </button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export default function CounsellingBookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          Loading...
        </main>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
