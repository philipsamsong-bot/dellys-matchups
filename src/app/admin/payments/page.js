"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getStatusClass(status) {
  if (status === "paid") return "bg-green-500 text-white";
  if (status === "rejected") return "bg-red-500 text-white";
  return "bg-yellow-500 text-black";
}

function formatStatus(status) {
  return (status || "pending_confirmation").replaceAll("_", " ");
}

function getBookingIdFromNotes(notes) {
  if (!notes?.includes("Booking ID:")) return null;
  return notes.split("Booking ID:")[1]?.split(".")[0]?.trim() || null;
}

function getCourseKeyFromNotes(notes) {
  return notes?.split("Course Key:")[1]?.split("\n")[0]?.trim() || "full-academy";
}

function getPlanKey(payment) {
  const planFromNotes = payment.notes?.split("Plan:")[1]?.split("\n")[0]?.trim();

  if (planFromNotes === "vip" || planFromNotes === "premium") {
    return planFromNotes;
  }

  return payment.item_name?.toLowerCase().includes("vip") ? "vip" : "premium";
}

function isAdmin(profile) {
  return profile?.role === "admin";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
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

    if (!isAdmin(profile)) {
      window.location.href = "/dashboard";
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setPayments(data || []);
    setLoading(false);
  }

  const filteredPayments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return payments;

    return payments.filter((payment) =>
      [
        payment.customer_name,
        payment.customer_email,
        payment.purpose,
        payment.item_name,
        payment.payment_method,
        payment.status,
        payment.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [payments, search]);

  async function activateMembership(payment) {
    const planKey = getPlanKey(payment);

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: planKey,
        membership_plan: planKey,
        subscription: planKey,
      })
      .eq("email", payment.customer_email);

    if (error) throw new Error(error.message);
  }

  async function activateAcademy(payment) {
    const courseKey = getCourseKeyFromNotes(payment.notes);

    const { error } = await supabase.from("academy_enrollments").upsert(
      {
        user_email: payment.customer_email,
        customer_name: payment.customer_name,
        course_key: courseKey,
        course_title: payment.item_name,
        access_type: courseKey === "full-academy" ? "full" : "single",
        payment_id: payment.id,
        status: "active",
      },
      {
        onConflict: "user_email,course_key",
      }
    );

    if (error) throw new Error(error.message);
  }

  async function updateCounsellingBooking(payment, status) {
    const bookingId = getBookingIdFromNotes(payment.notes);

    if (!bookingId) return;

    const { error } = await supabase
      .from("counselling_bookings")
      .update({
        payment_status: status === "paid" ? "paid" : status,
      })
      .eq("id", bookingId);

    if (error) throw new Error(error.message);
  }

  async function updateStatus(payment, status) {
    setUpdatingId(payment.id);

    try {
      const { error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", payment.id);

      if (error) throw new Error(error.message);

      if (payment.purpose === "counselling") {
        await updateCounsellingBooking(payment, status);
      }

      if (payment.purpose === "academy" && status === "paid") {
        await activateAcademy(payment);
      }

      if (payment.purpose === "membership" && status === "paid") {
        await activateMembership(payment);
      }

      setPayments((currentPayments) =>
        currentPayments.map((item) =>
          item.id === payment.id ? { ...item, status } : item
        )
      );

      alert(`Payment marked as ${formatStatus(status)}.`);
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deletePayment(paymentId) {
    const confirmed = confirm("Delete this payment record?");
    if (!confirmed) return;

    setUpdatingId(paymentId);

    const { error } = await supabase.from("payments").delete().eq("id", paymentId);

    if (error) {
      setUpdatingId(null);
      alert(error.message);
      return;
    }

    setPayments((currentPayments) =>
      currentPayments.filter((payment) => payment.id !== paymentId)
    );

    setUpdatingId(null);
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <a href="/dashboard" className="font-bold text-white/70 hover:text-white">
            ← Back to Dashboard
          </a>

          <p className="mt-8 font-black uppercase tracking-[0.35em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-4 text-6xl font-bold">Payments</h1>

          <p className="mt-5 max-w-3xl text-white/70">
            Approve or reject manual payments. Approving membership payments
            upgrades users automatically. Approving academy payments unlocks
            academy access. Counselling payments update booking status.
          </p>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search payments by name, email, purpose, method, status or notes..."
            className="mt-8 h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
          />

          {loading ? (
            <p className="mt-10 text-xl font-black">Loading payments...</p>
          ) : filteredPayments.length === 0 ? (
            <div className="mt-10 rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-4xl font-bold">
                No Payments Found
              </h2>
            </div>
          ) : (
            <section className="mt-10 grid gap-6">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-[2rem] bg-black/25 p-6 shadow-2xl"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${getStatusClass(
                          payment.status
                        )}`}
                      >
                        {formatStatus(payment.status)}
                      </span>

                      <h2 className="font-display mt-5 text-4xl font-bold">
                        {payment.item_name || "Payment"}
                      </h2>

                      <p className="mt-3 font-bold">
                        {payment.customer_name || "No name"}
                      </p>

                      <p className="text-white/60">
                        {payment.customer_email || "No email"}
                      </p>

                      <div className="mt-5 grid gap-3 text-white/80 md:grid-cols-2">
                        <p>
                          <strong>Purpose:</strong> {payment.purpose || "N/A"}
                        </p>
                        <p>
                          <strong>Amount:</strong> {payment.currency || "USD"}{" "}
                          {payment.amount}
                        </p>
                        <p>
                          <strong>Method:</strong>{" "}
                          {payment.payment_method || "N/A"}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>

                      {payment.provider_reference && (
                        <p className="mt-4 text-white/70">
                          <strong>Reference:</strong>{" "}
                          {payment.provider_reference}
                        </p>
                      )}

                      {payment.notes && (
                        <p className="mt-4 whitespace-pre-line leading-7 text-white/70">
                          {payment.notes}
                        </p>
                      )}

                      {payment.proof_url && (
                        <a
                          href={payment.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
                        >
                          View Proof
                        </a>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      {payment.status !== "paid" && (
                        <button
                          type="button"
                          disabled={updatingId === payment.id}
                          onClick={() => updateStatus(payment, "paid")}
                          className="rounded-full bg-white px-5 py-3 font-black text-[#b30018] disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}

                      {payment.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={updatingId === payment.id}
                          onClick={() => updateStatus(payment, "rejected")}
                          className="rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={updatingId === payment.id}
                        onClick={() => deletePayment(payment.id)}
                        className="rounded-full bg-black px-5 py-3 font-black text-white disabled:opacity-50"
                      >
                        Delete
                      </button>

                      {updatingId === payment.id && (
                        <p className="w-full text-sm text-white/60">
                          Updating...
                        </p>
                      )}
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
