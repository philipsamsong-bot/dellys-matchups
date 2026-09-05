// src/app/admin/counselling-bookings/page.js

"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function AdminCounsellingBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    void loadBookings();
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
    const token = await getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
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
        data.error ||
          "Unable to complete the admin request.",
      );
    }

    return data;
  }

  async function loadBookings() {
    setLoading(true);
    setPageError("");

    try {
      const data = await adminFetch(
        "/api/admin/counselling-bookings",
        {
          method: "GET",
        },
      );

      setBookings(
        Array.isArray(data.bookings)
          ? data.bookings
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

  const filteredBookings = useMemo(() => {
    if (filter === "all") {
      return bookings;
    }

    return bookings.filter(
      (booking) =>
        booking.payment_status === filter,
    );
  }, [bookings, filter]);

  async function updateStatus(
    booking,
    status,
  ) {
    if (updatingId !== null) {
      return;
    }

    const actionLabel =
      status === "completed"
        ? "Mark this booking as completed?"
        : "Cancel this booking?";

    const confirmed =
      window.confirm(actionLabel);

    if (!confirmed) {
      return;
    }

    setUpdatingId(booking.id);

    try {
      const data = await adminFetch(
        "/api/admin/counselling-bookings",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: booking.id,
            status,
          }),
        },
      );

      if (!data.booking) {
        throw new Error(
          "The updated counselling booking was not returned.",
        );
      }

      setBookings(
        (currentBookings) =>
          currentBookings.map(
            (currentBooking) =>
              currentBooking.id ===
              booking.id
                ? {
                    ...currentBooking,
                    ...data.booking,
                  }
                : currentBooking,
          ),
      );

      alert(
        data.alreadyUpdated
          ? `Booking is already ${status}.`
          : `Booking marked ${status}.`,
      );
    } catch (error) {
      alert(
        getErrorMessage(error),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />

        <main className="flex min-h-screen items-center justify-center bg-[#b30018] px-6 text-white">
          <p className="text-2xl font-bold">
            Loading counselling bookings...
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-40 text-white">
        <div className="mx-auto max-w-7xl">
          <a
            href="/dashboard"
            className="font-bold text-white/70 hover:text-white"
          >
            ← Back to Dashboard
          </a>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin Dashboard
          </p>

          <h1 className="mt-6 text-6xl font-black leading-none">
            Counselling Bookings
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
            Manage counselling requests, payments,
            mentorship bookings, and client sessions.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/60">
            Payment approval is handled through Admin
            Payments. This page manages booking lifecycle
            status only.
          </p>

          {pageError && (
            <div className="mt-10 rounded-[2rem] bg-white p-6 text-[#b30018]">
              <p className="font-black">
                Unable to load counselling bookings
              </p>

              <p className="mt-3">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadBookings()
                }
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "all"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("pending")
              }
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "pending"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Pending
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("paid")
              }
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "paid"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Paid
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("completed")
              }
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "completed"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Completed
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("cancelled")
              }
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "cancelled"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Cancelled
            </button>
          </div>

          <div className="mt-12 grid gap-8">
            {filteredBookings.length === 0 ? (
              <div className="rounded-[2rem] bg-[#c1121f] p-10 shadow-2xl">
                <p className="text-xl font-bold text-white/75">
                  No counselling bookings found.
                </p>
              </div>
            ) : (
              filteredBookings.map(
                (booking) => {
                  const busy =
                    updatingId === booking.id;

                  return (
                    <article
                      key={booking.id}
                      className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h2 className="text-4xl font-black">
                            {booking.full_name ||
                              "Unknown Client"}
                          </h2>

                          <div className="mt-5 space-y-2 text-white/75">
                            <p>
                              <strong>
                                Email:
                              </strong>{" "}
                              {booking.email ||
                                "N/A"}
                            </p>

                            <p>
                              <strong>
                                Phone:
                              </strong>{" "}
                              {booking.phone ||
                                "N/A"}
                            </p>

                            <p>
                              <strong>
                                Country:
                              </strong>{" "}
                              {booking.country ||
                                "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <span className="rounded-full bg-white px-6 py-3 text-center font-black uppercase text-[#b30018]">
                            {booking.payment_status ||
                              "pending"}
                          </span>

                          <span className="rounded-full bg-black/20 px-6 py-3 text-center font-bold uppercase text-white">
                            {booking.service ||
                              "Counselling"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-10 grid gap-5 md:grid-cols-2">
                        <div className="rounded-2xl bg-white/10 p-5">
                          <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                            Relationship Status
                          </p>

                          <p className="mt-3 text-xl font-bold">
                            {booking.relationship_status ||
                              "N/A"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 p-5">
                          <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                            Preferred Date
                          </p>

                          <p className="mt-3 text-xl font-bold">
                            {booking.preferred_date ||
                              "N/A"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 p-5">
                          <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                            Paid Amount
                          </p>

                          <p className="mt-3 text-xl font-bold">
                            {booking.paid_amount ||
                              "Not Paid"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 p-5">
                          <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                            Submitted
                          </p>

                          <p className="mt-3 text-xl font-bold">
                            {booking.created_at
                              ? new Date(
                                  booking.created_at,
                                ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-10 rounded-[2rem] bg-white/10 p-6">
                        <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                          Client Message
                        </p>

                        <p className="mt-5 whitespace-pre-wrap break-words text-lg leading-8 text-white/80">
                          {booking.message || ""}
                        </p>
                      </div>

                      <div className="mt-10 flex flex-wrap gap-4">
                        {booking.email && (
                          <a
                            href={`mailto:${booking.email}`}
                            className="rounded-full bg-white px-6 py-3 font-black text-[#b30018] transition hover:scale-[1.02]"
                          >
                            Email Client
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={
                            updatingId !==
                              null ||
                            booking.payment_status ===
                              "completed"
                          }
                          onClick={() =>
                            void updateStatus(
                              booking,
                              "completed",
                            )
                          }
                          className="rounded-full bg-white/10 px-6 py-3 font-black transition hover:bg-white hover:text-[#b30018] disabled:opacity-50"
                        >
                          {busy
                            ? "Updating..."
                            : "Mark Completed"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId !==
                              null ||
                            booking.payment_status ===
                              "cancelled"
                          }
                          onClick={() =>
                            void updateStatus(
                              booking,
                              "cancelled",
                            )
                          }
                          className="rounded-full bg-white/10 px-6 py-3 font-black transition hover:bg-white hover:text-[#b30018] disabled:opacity-50"
                        >
                          {busy
                            ? "Updating..."
                            : "Cancel Booking"}
                        </button>
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>
        </div>
      </main>
    </>
  );
}
