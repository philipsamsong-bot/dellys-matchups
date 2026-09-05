// src/app/admin/shop-orders/[id]/page.js

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

const STATUSES = [
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
}

function formatStatus(value, fallback = "pending") {
  return (value || fallback).replaceAll("_", " ");
}

export default function AdminShopOrderDetailsPage() {
  const params = useParams();

  const orderId =
    typeof params?.id === "string"
      ? params.id
      : "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setPageError("Shop order ID is missing.");
      return;
    }

    void fetchOrder();
  }, [orderId]);

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

  async function adminFetch(
    url,
    options = {},
  ) {
    const token =
      await getAccessToken();

    const response =
      await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization:
            `Bearer ${token}`,
        },
        cache: "no-store",
      });

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      window.location.href = "/auth/login";

      throw new Error(
        data.error ||
          "Your session has expired.",
      );
    }

    if (response.status === 403) {
      window.location.href = "/dashboard";

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

  async function fetchOrder() {
    setLoading(true);
    setPageError("");

    try {
      const data =
        await adminFetch(
          `/api/shop/order-status?id=${encodeURIComponent(
            orderId,
          )}`,
          {
            method: "GET",
          },
        );

      setOrder(
        data.order || null,
      );
    } catch (error) {
      setOrder(null);

      setPageError(
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    event,
  ) {
    const newStatus =
      event.target.value;

    if (
      !order ||
      saving ||
      newStatus ===
        order.status
    ) {
      return;
    }

    const previousStatus =
      order.status;

    setSaving(true);

    try {
      const data =
        await adminFetch(
          "/api/shop/order-status",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              orderId:
                order.id,
              status:
                newStatus,
            }),
          },
        );

      if (!data.order) {
        throw new Error(
          "The updated Shop order was not returned.",
        );
      }

      setOrder(
        data.order,
      );

      alert(
        data.alreadyUpdated
          ? `Order is already ${formatStatus(
              newStatus,
            )}.`
          : `Order status updated to ${formatStatus(
              newStatus,
            )}.`,
      );
    } catch (error) {
      setOrder(
        (currentOrder) =>
          currentOrder
            ? {
                ...currentOrder,
                status:
                  previousStatus,
              }
            : currentOrder,
      );

      alert(
        getErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />

        <main className="flex min-h-screen items-center justify-center bg-[#b30018] px-6 text-white">
          <p className="text-center text-xl font-bold">
            Loading order...
          </p>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <DashboardChrome />

        <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-40 text-white">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/admin/shop-orders"
              className="font-bold text-red-100"
            >
              ← Back to Orders
            </Link>

            <div className="mt-10 rounded-[3rem] bg-white p-8 text-[#b30018] shadow-2xl">
              <h1 className="font-display text-5xl font-bold">
                Order Not Found
              </h1>

              <p className="mt-5 text-black/70">
                {pageError ||
                  "This Shop order could not be found."}
              </p>

              <button
                type="button"
                onClick={() =>
                  void fetchOrder()
                }
                className="mt-6 rounded-full bg-[#b30018] px-6 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-40 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/shop-orders"
            className="font-bold text-red-100"
          >
            ← Back to Orders
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">
            Order Details
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            Review the customer,
            payment information,
            purchased items and
            fulfilment status for
            this Shop order.
          </p>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <p className="font-black">
              Payment and fulfilment are separate
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Payment status is
              verified through
              PayPal or Admin
              Payments. The Order
              Status control below
              manages fulfilment
              only.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[3rem] bg-white p-8 text-black shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                Customer
              </h2>

              <div className="mt-8 space-y-5 text-lg">
                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {order.customer_name ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Email:
                  </strong>{" "}
                  {order.customer_email ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{" "}
                  {order.customer_phone ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Address:
                  </strong>{" "}
                  {order.address ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    City:
                  </strong>{" "}
                  {order.city ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Country:
                  </strong>{" "}
                  {order.country ||
                    "N/A"}
                </p>

                {order.note && (
                  <div>
                    <strong>
                      Note:
                    </strong>

                    <p className="mt-2 whitespace-pre-wrap break-words text-black/70">
                      {order.note}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[3rem] bg-white p-8 text-black shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                Payment & Status
              </h2>

              <div className="mt-8 space-y-5 text-lg">
                <p>
                  <strong>
                    Order ID:
                  </strong>{" "}
                  <span className="break-all">
                    {order.id}
                  </span>
                </p>

                <p>
                  <strong>
                    Order Number:
                  </strong>{" "}
                  {order.order_number ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Total:
                  </strong>{" "}
                  <span className="font-black text-[#b30018]">
                    $
                    {formatAmount(
                      order.total_amount,
                    )}
                  </span>
                </p>

                <p>
                  <strong>
                    Payment Method:
                  </strong>{" "}
                  {order.payment_method ||
                    "N/A"}
                </p>

                <p>
                  <strong>
                    Payment Status:
                  </strong>{" "}
                  <span className="font-black capitalize">
                    {formatStatus(
                      order.payment_status,
                      "pending_confirmation",
                    )}
                  </span>
                </p>

                <p>
                  <strong>
                    PayPal Order ID:
                  </strong>{" "}
                  <span className="break-all">
                    {order.paypal_order_id ||
                      "Not available"}
                  </span>
                </p>

                <p>
                  <strong>
                    Date:
                  </strong>{" "}
                  {order.created_at
                    ? new Date(
                        order.created_at,
                      ).toLocaleString()
                    : "N/A"}
                </p>

                <div>
                  <label
                    htmlFor="order-status"
                    className="block font-bold"
                  >
                    Order Status
                  </label>

                  <select
                    id="order-status"
                    value={
                      order.status ||
                      "paid"
                    }
                    disabled={saving}
                    onChange={
                      updateStatus
                    }
                    className="mt-3 h-14 w-full rounded-2xl border border-black/10 px-5 outline-none disabled:opacity-50"
                  >
                    {STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatStatus(
                            status,
                          )}
                        </option>
                      ),
                    )}
                  </select>

                  {saving && (
                    <p className="mt-3 text-sm font-bold text-[#b30018]">
                      Saving status...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[3rem] bg-white p-8 text-black shadow-2xl">
            <h2 className="font-display text-5xl font-bold">
              Items Purchased
            </h2>

            {!Array.isArray(
              order.items,
            ) ||
            order.items.length ===
              0 ? (
              <p className="mt-8 text-black/60">
                No item details
                were stored for
                this order.
              </p>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {order.items.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={`${
                        item.id ||
                        item.title ||
                        "item"
                      }-${index}`}
                      className="flex gap-5 rounded-[2rem] bg-[#fff8f5] p-5"
                    >
                      {item.image ? (
                        <img
                          src={
                            item.image
                          }
                          alt={
                            item.title ||
                            "Shop item"
                          }
                          className="h-28 w-24 rounded-xl bg-white object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-28 w-24 items-center justify-center rounded-xl bg-white text-xs font-bold text-black/40">
                          No Image
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="break-words text-xl font-black">
                          {item.title ||
                            "Shop Item"}
                        </p>

                        <p className="mt-2 text-lg font-black text-[#b30018]">
                          $
                          {formatAmount(
                            item.price,
                          )}
                        </p>

                        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-black/50">
                          {item.type ||
                            "product"}
                        </p>

                        {item.quantity && (
                          <p className="mt-2 text-sm text-black/60">
                            Quantity:{" "}
                            {
                              item.quantity
                            }
                          </p>
                        )}

                        {item.subtotal !==
                          undefined && (
                          <p className="mt-1 text-sm text-black/60">
                            Subtotal:
                            $
                            {formatAmount(
                              item.subtotal,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
