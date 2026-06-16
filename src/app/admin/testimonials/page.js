"use client";

import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setTestimonials(data || []);
    }

    setLoading(false);
  }

  async function toggleApproved(testimonial) {
    const { error } = await supabase
      .from("testimonials")
      .update({ approved: !testimonial.approved })
      .eq("id", testimonial.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTestimonials();
  }

  async function deleteTestimonial(testimonialId) {
    const confirmed = confirm("Delete this testimonial permanently?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", testimonialId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTestimonials();
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-black uppercase tracking-[0.35em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-4 text-6xl font-bold">
            Testimonials
          </h1>

          {loading ? (
            <p className="mt-10 text-xl font-black">Loading testimonials...</p>
          ) : testimonials.length === 0 ? (
            <div className="mt-10 rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-4xl font-bold">
                No Testimonials Yet
              </h2>
            </div>
          ) : (
            <section className="mt-10 grid gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-[2rem] bg-black/25 p-6 shadow-2xl"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-red-100">
                        {testimonial.approved ? "Approved" : "Pending"}
                      </p>

                      <h2 className="font-display mt-3 text-4xl font-bold">
                        {testimonial.title}
                      </h2>

                      <p className="mt-3 font-bold">
                        {testimonial.full_name}
                      </p>

                      <p className="text-white/60">{testimonial.email}</p>

                      <p className="mt-5 whitespace-pre-line leading-8 text-white/80">
                        {testimonial.message}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => toggleApproved(testimonial)}
                        className="rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
                      >
                        {testimonial.approved ? "Unapprove" : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTestimonial(testimonial.id)}
                        className="rounded-full bg-black px-5 py-3 font-black text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
