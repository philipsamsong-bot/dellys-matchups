"use client";

import { useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const emptyForm = {
  full_name: "",
  email: "",
  title: "",
  message: "",
};

export default function TestimonialPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.title.trim() ||
      !form.message.trim()
    ) {
      alert("Please complete all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("testimonials").insert({
      full_name: form.full_name,
      email: form.email,
      title: form.title,
      message: form.message,
      approved: false,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Thank you. Your testimonial has been submitted for review.");
    setForm(emptyForm);
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
              Submit Testimonial
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Share how Delly&apos;s Matchups, counselling, teachings, or the
              community has impacted your life.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Full name"
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Testimonial title"
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <textarea
              rows="8"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Write your testimonial..."
              className="rounded-2xl bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Testimonial"}
            </button>
          </form>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
