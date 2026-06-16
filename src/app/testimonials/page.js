"use client";

import { useEffect, useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTestimonials() {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (!error) {
        setTestimonials(data || []);
      }

      setLoading(false);
    }

    loadTestimonials();
  }, []);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <section className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.35em] text-red-100">
              Testimonials
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold md:text-8xl">
              Stories of Impact
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
              Real stories from people impacted by Delly&apos;s Matchups.
            </p>
          </div>

          {loading && (
            <p className="mt-16 text-center text-xl font-black">
              Loading testimonials...
            </p>
          )}

          {!loading && testimonials.length === 0 && (
            <div className="mx-auto mt-16 max-w-3xl rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-5xl font-bold">
                No Testimonials Published Yet
              </h2>
            </div>
          )}

          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="rounded-[3rem] bg-black/25 p-8 shadow-2xl"
              >
                <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                  Testimonial
                </p>

                <h2 className="font-display mt-5 text-4xl font-bold">
                  {testimonial.title}
                </h2>

                <p className="mt-5 whitespace-pre-line leading-8 text-white/80">
                  {testimonial.message}
                </p>

                <p className="mt-8 font-black">
                  {testimonial.full_name}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
