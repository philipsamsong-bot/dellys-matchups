// src/app/admin/testimonials/page.js

"use client";

import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    void loadTestimonials();
  }, []);

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      window.location.href = "/auth/login";
      throw new Error("Not authenticated.");
    }

    return session.access_token;
  }

  async function adminFetch(url, options = {}) {
    const accessToken = await getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      window.location.href = "/auth/login";
      throw new Error(
        data.error || "Your session has expired.",
      );
    }

    if (response.status === 403) {
      window.location.href = "/dashboard";
      throw new Error(
        data.error || "Admin access required.",
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to complete the admin request.",
      );
    }

    return data;
  }

  async function loadTestimonials() {
    setLoading(true);
    setPageError("");

    try {
      const data = await adminFetch(
        "/api/admin/testimonials",
        {
          method: "GET",
        },
      );

      setTestimonials(
        Array.isArray(data.testimonials)
          ? data.testimonials
          : [],
      );
    } catch (error) {
      setPageError(
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleApproved(testimonial) {
    if (actionId) {
      return;
    }

    setActionId(testimonial.id);

    try {
      const data = await adminFetch(
        "/api/admin/testimonials",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: testimonial.id,
            approved: !testimonial.approved,
          }),
        },
      );

      if (!data.testimonial) {
        throw new Error(
          "The updated testimonial was not returned.",
        );
      }

      setTestimonials((currentTestimonials) =>
        currentTestimonials.map((currentTestimonial) =>
          currentTestimonial.id === data.testimonial.id
            ? data.testimonial
            : currentTestimonial,
        ),
      );
    } catch (error) {
      alert(
        getErrorMessage(error),
      );
    } finally {
      setActionId("");
    }
  }

  async function deleteTestimonial(testimonialId) {
    if (actionId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this testimonial permanently?",
    );

    if (!confirmed) {
      return;
    }

    setActionId(testimonialId);

    try {
      await adminFetch(
        `/api/admin/testimonials?id=${encodeURIComponent(
          testimonialId,
        )}`,
        {
          method: "DELETE",
        },
      );

      setTestimonials((currentTestimonials) =>
        currentTestimonials.filter(
          (testimonial) =>
            testimonial.id !== testimonialId,
        ),
      );
    } catch (error) {
      alert(
        getErrorMessage(error),
      );
    } finally {
      setActionId("");
    }
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

          {pageError && (
            <div className="mt-10 rounded-[3rem] bg-white p-8 text-black shadow-2xl">
              <p className="font-black text-[#b30018]">
                Unable to load testimonials
              </p>

              <p className="mt-3 text-black/70">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadTestimonials()
                }
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {loading ? (
            <p className="mt-10 text-xl font-black">
              Loading testimonials...
            </p>
          ) : testimonials.length === 0 ? (
            <div className="mt-10 rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-4xl font-bold">
                No Testimonials Yet
              </h2>
            </div>
          ) : (
            <section className="mt-10 grid gap-6">
              {testimonials.map((testimonial) => {
                const busy = actionId === testimonial.id;

                return (
                  <div
                    key={testimonial.id}
                    className="rounded-[2rem] bg-black/25 p-6 shadow-2xl"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-100">
                          {testimonial.approved
                            ? "Approved"
                            : "Pending"}
                        </p>

                        <h2 className="font-display mt-3 break-words text-4xl font-bold">
                          {testimonial.title ||
                            "Untitled Testimonial"}
                        </h2>

                        <p className="mt-3 font-bold">
                          {testimonial.full_name ||
                            "Unnamed User"}
                        </p>

                        <p className="break-all text-white/60">
                          {testimonial.email ||
                            "No email"}
                        </p>

                        <p className="mt-5 whitespace-pre-line break-words leading-8 text-white/80">
                          {testimonial.message ||
                            "No testimonial message provided."}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={actionId !== ""}
                          onClick={() =>
                            void toggleApproved(testimonial)
                          }
                          className="rounded-full bg-white px-5 py-3 font-black text-[#b30018] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy
                            ? "Saving..."
                            : testimonial.approved
                              ? "Unapprove"
                              : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={actionId !== ""}
                          onClick={() =>
                            void deleteTestimonial(
                              testimonial.id,
                            )
                          }
                          className="rounded-full bg-black px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy
                            ? "Working..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
