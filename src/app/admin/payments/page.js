// src/app/admin/payments/page.js

"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

const MANUAL_PAYMENT_METHODS = new Set([
  "Mobile Money",
  "Bank Transfer",
]);

function getStatusClass(status) {
  if (status === "paid") {
    return "bg-green-500 text-white";
  }

  if (status === "rejected") {
    return "bg-red-500 text-white";
  }

  return "bg-yellow-500 text-black";
}

function formatStatus(status) {
  return (
    status ||
    "pending_confirmation"
  ).replaceAll("_", " ");
}

function isManualPayment(payment) {
  return MANUAL_PAYMENT_METHODS.has(
    payment?.payment_method,
  );
}

function getPurposeLabel(purpose) {
  switch (purpose) {
    case "membership":
      return "Matchups Membership";

    case "academy":
      return "Academy";

    case "counselling":
      return "Counselling";

    case "shop":
      return "Shop";

    case "donation":
      return "Donation";

    case "partner":
      return "Partner";

    default:
      return purpose || "Unknown";
  }
}

function getPaymentActionDescription(payment) {
  switch (payment?.purpose) {
    case "membership":
      return "Approval activates the member's Matchups plan.";

    case "academy":
      return "Approval activates the purchased Academy access.";

    case "counselling":
      return "Approval updates the linked counselling booking payment status.";

    case "shop":
      return "Approval marks the linked Shop order as paid and processing.";

    case "donation":
      return "Approval confirms this donation as paid.";

    case "partner":
      return "Approval confirms this partnership contribution as paid.";

    default:
      return "";
  }
}

function getErrorMessage(error) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function AdminPaymentsPage() {
  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  useEffect(() => {
    void loadPayments();
  }, []);

  async function getAccessToken() {
    const {
      data: {
        session,
      },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      throw new Error(
        error.message,
      );
    }

    if (
      !session?.access_token
    ) {
      window.location.href =
        "/auth/login";

      throw new Error(
        "Not authenticated.",
      );
    }

    return session.access_token;
  }

  async function adminFetch(
    url,
    options = {},
  ) {
    const accessToken =
      await getAccessToken();

    const response =
      await fetch(
        url,
        {
          ...options,

          headers: {
            ...(options.headers ||
              {}),

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        },
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (
      response.status === 401
    ) {
      window.location.href =
        "/auth/login";

      throw new Error(
        data.error ||
          "Your session has expired.",
      );
    }

    if (
      response.status === 403
    ) {
      window.location.href =
        "/dashboard";

      throw new Error(
        data.error ||
          "Admin access required.",
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

  async function loadPayments() {
    setLoading(true);
    setPageError("");

    try {
      const data =
        await adminFetch(
          "/api/admin/payments",
          {
            method: "GET",
          },
        );

      setPayments(
        Array.isArray(
          data.payments,
        )
          ? data.payments
          : [],
      );
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredPayments =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return payments;
      }

      return payments.filter(
        (payment) =>
          [
            payment.customer_name,
            payment.customer_email,
            payment.purpose,
            payment.item_name,
            payment.payment_method,
            payment.status,
            payment.provider_reference,
            payment.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(
              keyword,
            ),
      );
    }, [
      payments,
      search,
    ]);

  async function updateStatus(
    payment,
    status,
  ) {
    if (
      !isManualPayment(
        payment,
      )
    ) {
      alert(
        "PayPal/Card payments are verified automatically and cannot be manually approved or rejected.",
      );

      return;
    }

    const action =
      status === "paid"
        ? "approve"
        : "reject";

    const confirmed =
      window.confirm(
        `${
          action === "approve"
            ? "Approve"
            : "Reject"
        } this payment?`,
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      payment.id,
    );

    try {
      const data =
        await adminFetch(
          "/api/admin/payments",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                paymentId:
                  payment.id,

                status,
              }),
          },
        );

      if (
        !data.payment
      ) {
        throw new Error(
          "The updated payment was not returned.",
        );
      }

      setPayments(
        (
          currentPayments,
        ) =>
          currentPayments.map(
            (item) =>
              item.id ===
              payment.id
                ? data.payment
                : item,
          ),
      );

      alert(
        data.alreadyUpdated
          ? `Payment is already marked as ${formatStatus(
              status,
            )}.`
          : `Payment marked as ${formatStatus(
              status,
            )}.`,
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setUpdatingId(
        null,
      );
    }
  }

  async function deletePayment(
    payment,
  ) {
    if (
      payment.status ===
      "paid"
    ) {
      alert(
        "Paid payment records cannot be deleted.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Delete this payment record? This action cannot be undone.",
      );

    if (!confirmed) {
      return;
    }

    setUpdatingId(
      payment.id,
    );

    try {
      await adminFetch(
        `/api/admin/payments?id=${encodeURIComponent(
          payment.id,
        )}`,
        {
          method:
            "DELETE",
        },
      );

      setPayments(
        (
          currentPayments,
        ) =>
          currentPayments.filter(
            (item) =>
              item.id !==
              payment.id,
          ),
      );

      alert(
        "Payment record deleted.",
      );
    } catch (error) {
      alert(
        getErrorMessage(
          error,
        ),
      );
    } finally {
      setUpdatingId(
        null,
      );
    }
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <a
            href="/dashboard"
            className="font-bold text-white/70 hover:text-white"
          >
            ← Back to Dashboard
          </a>

          <p className="mt-8 font-black uppercase tracking-[0.35em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-4 text-6xl font-bold">
            Payments
          </h1>

          <p className="mt-5 max-w-3xl text-white/70">
            Review Mobile Money
            and Bank Transfer
            submissions before
            approving or
            rejecting them.
            Matchups, Academy,
            Counselling and Shop
            fulfilment happens
            automatically after
            approval. Donations
            and Partner
            contributions are
            recorded as paid.
            PayPal/Card payments
            are verified
            automatically.
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <p className="font-black">
              Manual payment
              workflow
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Check the amount,
              transaction
              reference and
              uploaded proof
              before approving
              Mobile Money or
              Bank Transfer
              submissions.
            </p>
          </div>

          <input
            value={search}
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Search payments by name, email, purpose, method, status, reference or notes..."
            className="mt-8 h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
          />

          {loading ? (
            <p className="mt-10 text-xl font-black">
              Loading
              payments...
            </p>
          ) : pageError ? (
            <div className="mt-10 rounded-[2rem] bg-white p-6 text-[#b30018]">
              <p className="font-black">
                Unable to load
                payments
              </p>

              <p className="mt-3">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadPayments()
                }
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredPayments.length ===
            0 ? (
            <div className="mt-10 rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-4xl font-bold">
                No Payments
                Found
              </h2>
            </div>
          ) : (
            <section className="mt-10 grid gap-6">
              {filteredPayments.map(
                (
                  payment,
                ) => {
                  const manual =
                    isManualPayment(
                      payment,
                    );

                  const actionDescription =
                    getPaymentActionDescription(
                      payment,
                    );

                  const busy =
                    updatingId ===
                    payment.id;

                  return (
                    <div
                      key={
                        payment.id
                      }
                      className="rounded-[2rem] bg-black/25 p-6 shadow-2xl"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${getStatusClass(
                                payment.status,
                              )}`}
                            >
                              {formatStatus(
                                payment.status,
                              )}
                            </span>

                            <span className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/75">
                              {manual
                                ? "Manual Review"
                                : "Automatic Verification"}
                            </span>
                          </div>

                          <h2 className="font-display mt-5 break-words text-4xl font-bold">
                            {payment.item_name ||
                              "Payment"}
                          </h2>

                          <p className="mt-3 font-bold">
                            {payment.customer_name ||
                              "No name"}
                          </p>

                          <p className="break-all text-white/60">
                            {payment.customer_email ||
                              "No email"}
                          </p>

                          <div className="mt-5 grid gap-3 text-white/80 md:grid-cols-2">
                            <p>
                              <strong>
                                Purpose:
                              </strong>{" "}
                              {getPurposeLabel(
                                payment.purpose,
                              )}
                            </p>

                            <p>
                              <strong>
                                Amount:
                              </strong>{" "}
                              {payment.currency ||
                                "USD"}{" "}
                              {payment.amount}
                            </p>

                            <p>
                              <strong>
                                Method:
                              </strong>{" "}
                              {payment.payment_method ||
                                "N/A"}
                            </p>

                            <p>
                              <strong>
                                Date:
                              </strong>{" "}
                              {payment.created_at
                                ? new Date(
                                    payment.created_at,
                                  ).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>

                          {actionDescription && (
                            <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/75">
                              {
                                actionDescription
                              }
                            </p>
                          )}

                          {payment.provider_reference && (
                            <p className="mt-4 break-all text-white/70">
                              <strong>
                                Reference:
                              </strong>{" "}
                              {
                                payment.provider_reference
                              }
                            </p>
                          )}

                          {payment.notes && (
                            <p className="mt-4 whitespace-pre-line break-words leading-7 text-white/70">
                              {
                                payment.notes
                              }
                            </p>
                          )}

                          {payment.proof_url && (
                            <a
                              href={
                                payment.proof_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-5 inline-flex rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
                            >
                              View
                              Proof
                            </a>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3 lg:max-w-[270px]">
                          {manual &&
                            payment.status ===
                              "pending_confirmation" && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    void updateStatus(
                                      payment,
                                      "paid",
                                    )
                                  }
                                  className="rounded-full bg-white px-5 py-3 font-black text-[#b30018] disabled:opacity-50"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    void updateStatus(
                                      payment,
                                      "rejected",
                                    )
                                  }
                                  className="rounded-full border border-white/20 px-5 py-3 font-black text-white disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                          {!manual && (
                            <p className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/65">
                              PayPal/Card
                              status is
                              controlled by
                              verified payment
                              capture and cannot
                              be overridden
                              here.
                            </p>
                          )}

                          {payment.status !==
                            "paid" && (
                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                void deletePayment(
                                  payment,
                                )
                              }
                              className="rounded-full bg-black px-5 py-3 font-black text-white disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}

                          {busy && (
                            <p className="w-full text-sm text-white/60">
                              Updating
                              payment...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
