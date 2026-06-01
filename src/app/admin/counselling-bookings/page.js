"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

export default function AdminCounsellingBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadBookings() {
        const {
            data: { user },
          } = await supabase.auth.getUser();
          
          if (!user) {
            window.location.href = "/auth/login";
            return;
          }
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          
          if (profile?.role !== "admin") {
            window.location.href = "/dashboard";
            return;
          }
           
      const { data, error } = await supabase
        .from("counselling_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setBookings(data || []);
      setLoading(false);
    }

    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    if (filter === "all") {
      return bookings;
    }

    return bookings.filter(
      (booking) => booking.payment_status === filter
    );
  }, [bookings, filter]);

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("counselling_bookings")
      .update({
        payment_status: status,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              payment_status: status,
            }
          : booking
      )
    );
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />

        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
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
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin Dashboard
          </p>

          <h1 className="mt-6 text-6xl font-black leading-none">
            Counselling Bookings
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
            Manage counselling requests, payments, mentorship bookings, and
            client sessions.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
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
              onClick={() => setFilter("pending")}
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "pending"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => setFilter("paid")}
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "paid"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Paid
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`rounded-full px-6 py-3 font-black uppercase ${
                filter === "completed"
                  ? "bg-white text-[#b30018]"
                  : "bg-white/10 text-white"
              }`}
            >
              Completed
            </button>

            <button
              onClick={() => setFilter("cancelled")}
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
              filteredBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-4xl font-black">
                        {booking.full_name}
                      </h2>

                      <div className="mt-5 space-y-2 text-white/75">
                        <p>
                          <strong>Email:</strong> {booking.email}
                        </p>

                        <p>
                          <strong>Phone:</strong> {booking.phone}
                        </p>

                        <p>
                          <strong>Country:</strong> {booking.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="rounded-full bg-white px-6 py-3 text-center font-black uppercase text-[#b30018]">
                        {booking.payment_status || "pending"}
                      </span>

                      <span className="rounded-full bg-black/20 px-6 py-3 text-center font-bold uppercase text-white">
                        {booking.service}
                      </span>
                    </div>
                  </div>

                  <div className="mt-10 grid gap-5 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-5">
                      <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                        Relationship Status
                      </p>

                      <p className="mt-3 text-xl font-bold">
                        {booking.relationship_status}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-5">
                      <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                        Preferred Date
                      </p>

                      <p className="mt-3 text-xl font-bold">
                        {booking.preferred_date}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-5">
                      <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                        Paid Amount
                      </p>

                      <p className="mt-3 text-xl font-bold">
                        {booking.paid_amount || "Not Paid"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-5">
                      <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                        Submitted
                      </p>

                      <p className="mt-3 text-xl font-bold">
                        {new Date(
                          booking.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 rounded-[2rem] bg-white/10 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-red-100">
                      Client Message
                    </p>

                    <p className="mt-5 text-lg leading-8 text-white/80">
                      {booking.message}
                    </p>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <a
                      href={`mailto:${booking.email}`}
                      className="rounded-full bg-white px-6 py-3 font-black text-[#b30018] transition hover:scale-[1.02]"
                    >
                      Email Client
                    </a>

                    <button
                      onClick={() =>
                        updateStatus(
                          booking.id,
                          "completed"
                        )
                      }
                      className="rounded-full bg-white/10 px-6 py-3 font-black transition hover:bg-white hover:text-[#b30018]"
                    >
                      Mark Completed
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          booking.id,
                          "cancelled"
                        )
                      }
                      className="rounded-full bg-white/10 px-6 py-3 font-black transition hover:bg-white hover:text-[#b30018]"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
