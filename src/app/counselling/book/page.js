"use client";

import { Suspense, useState } from "react";
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

function BookingForm() {
  const searchParams = useSearchParams();

  const selectedService =
    searchParams.get("service") || "premarital";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    service:
      services[selectedService] ||
      "Premarital Counselling",
    relationshipStatus: "",
    preferredDate: "",
    message: "",
    acceptedTerms: false,
  });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.acceptedTerms) {
      alert(
        "Please accept the terms and conditions before continuing."
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("counselling_bookings")
        .insert({
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          service: form.service,
          relationship_status:
            form.relationshipStatus,
          preferred_date:
            form.preferredDate,
          message: form.message,
          accepted_terms:
            form.acceptedTerms,
        })
        .select("id");

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = `/counselling/payment?booking=${data[0].id}`;
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Counselling Booking
            </p>

            <h1 className="mt-6 text-6xl font-bold md:text-8xl">
              Begin Your Healing Journey
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/80">
              Fill this form carefully. Your information
              will be treated with confidentiality,
              empathy, and respect.
            </p>
          </motion.div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-16 rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12"
          >
            {/* KEEP ALL YOUR EXISTING FORM FIELDS HERE */}

            <button
              type="submit"
              className="mt-10 w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018]"
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
