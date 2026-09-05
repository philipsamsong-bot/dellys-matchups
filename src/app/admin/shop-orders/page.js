// src/app/admin/shop-orders/page.js

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
}

function formatStatus(status, fallback = "pending") {
  return (status || fallback).replaceAll("_", " ");
}

function getPaymentStatusClass(status) {
  if (status === "paid") {
    return "bg-green-600 text-white";
  }

  if (
    status === "rejected" ||
    status === "refunded"
  ) {
    return "bg-red-600 text-white";
  }

  return "bg-yellow-400 text-black";
}

function getOrderStatusClass(status) {
  if (status === "delivered") {
    return "bg-green-600 text-white";
  }

  if (
    status === "cancelled" ||
    status === "refunded"
  ) {
    return "bg-red-600 text-white";
  }

  if (
    status === "processing" ||
    status === "shipped"
  ) {
    return "bg-blue-600 text-white";
  }

  return "bg-yellow-400 text-black";
}

function formatAmount(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toFixed(2);
}

export default function AdminShopOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    void loadShopOrders();
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
      window.location.href =
        "/auth/login";

      throw new Error(
        data.error ||
          "Your session has expired.",
      );
    }

    if (response.status === 403) {
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

  async function loadShopOrders() {
    setLoading(true);
    setPageError("");

    try {
      const data =
        await adminFetch(
          "/api/shop/order-status",
          {
            method: "GET",
          },
        );

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
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

  const filteredOrders =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return orders;
      }

      return orders.filter(
        (order) =>
          [
            order.id,
            order.order_number,
            order.customer_name,
            order.customer_email,
            order.customer_phone,
            order.address,
            order.city,
            order.country,
            order.payment_method,
            order.payment_status,
            order.status,
            order.note,
            order.paypal_order_id,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword),
      );
    }, [orders, search]);

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
            Admin
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">
            Shop Orders
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            View Shop orders,
            monitor payment
            status, and manage
            fulfilment from
            processing through
            delivery.
          </p>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <p className="font-black">
              Payment confirmation
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Manual Mobile
              Money and Bank
              Transfer payments
              are approved or
              rejected in Admin
              Payments. Shop
              Orders manages
              fulfilment after
              payment.
            </p>

            <Link
              href="/admin/payments"
              className="mt-4 inline-flex rounded-full bg-white px-5 py-3 font-black text-[#b30018]"
            >
              Open Admin Payments
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by order number, customer, email, status, method, address or notes..."
              className="h-14 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void loadShopOrders()
              }
              className="rounded-full border border-white/20 px-6 py-3 font-black text-white disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-14 overflow-hidden rounded-[3rem] bg-white text-black shadow-2xl">
            {loading ? (
              <div className="p-10 text-center font-bold">
                Loading Shop
                orders...
              </div>
            ) : pageError ? (
              <div className="p-10 text-center">
                <p className="font-black text-[#b30018]">
                  Unable to load
                  Shop orders
                </p>

                <p className="mt-3 text-black/70">
                  {pageError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadShopOrders()
                  }
                  className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
                >
                  Try Again
                </button>
              </div>
            ) : filteredOrders.length ===
              0 ? (
              <div className="p-10 text-center font-bold">
                No Shop orders
                found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse">
                  <thead className="bg-[#fff8f5] text-left">
                    <tr>
                      <th className="p-5">
                        Order
                      </th>

                      <th className="p-5">
                        Customer
                      </th>

                      <th className="p-5">
                        Email
                      </th>

                      <th className="p-5">
                        Total
                      </th>

                      <th className="p-5">
                        Payment Method
                      </th>

                      <th className="p-5">
                        Payment Status
                      </th>

                      <th className="p-5">
                        Order Status
                      </th>

                      <th className="p-5">
                        Date
                      </th>

                      <th className="p-5">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="border-t border-black/10"
                        >
                          <td className="p-5">
                            <p className="font-black text-[#b30018]">
                              {order.order_number ||
                                order.id
                                  .slice(0, 8)
                                  .toUpperCase()}
                            </p>

                            <p className="mt-1 text-xs text-black/45">
                              {order.id}
                            </p>
                          </td>

                          <td className="p-5 font-bold">
                            {order.customer_name ||
                              "Unknown"}
                          </td>

                          <td className="p-5 text-black/70">
                            {order.customer_email ||
                              "No email"}
                          </td>

                          <td className="p-5 font-black text-[#b30018]">
                            $
                            {formatAmount(
                              order.total_amount,
                            )}
                          </td>

                          <td className="p-5">
                            {order.payment_method ||
                              "N/A"}
                          </td>

                          <td className="p-5">
                            <span
                              className={`inline-flex rounded-full px-4 py-2 text-sm font-black capitalize ${getPaymentStatusClass(
                                order.payment_status,
                              )}`}
                            >
                              {formatStatus(
                                order.payment_status,
                                "pending_confirmation",
                              )}
                            </span>
                          </td>

                          <td className="p-5">
                            <span
                              className={`inline-flex rounded-full px-4 py-2 text-sm font-black capitalize ${getOrderStatusClass(
                                order.status,
                              )}`}
                            >
                              {formatStatus(
                                order.status,
                                "pending_confirmation",
                              )}
                            </span>
                          </td>

                          <td className="p-5 text-black/60">
                            {order.created_at
                              ? new Date(
                                  order.created_at,
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>

                          <td className="p-5">
                            <Link
                              href={`/admin/shop-orders/${encodeURIComponent(
                                order.id,
                              )}`}
                              className="inline-flex rounded-full bg-[#b30018] px-5 py-3 text-sm font-black text-white"
                            >
                              View Order
                            </Link>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>

                <div className="border-t border-black/10 p-6">
                  <p className="font-black text-[#b30018]">
                    Order Notes
                  </p>

                  <div className="mt-4 grid gap-4">
                    {filteredOrders.map(
                      (order) => (
                        <div
                          key={`${order.id}-notes`}
                          className="rounded-2xl bg-[#fff8f5] p-5"
                        >
                          <p className="font-black">
                            {order.order_number ||
                              order.id
                                .slice(0, 8)
                                .toUpperCase()}{" "}
                            —{" "}
                            {order.customer_name ||
                              "Unknown"}
                          </p>

                          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-black/70">
                            {order.note ||
                              "No notes provided."}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
