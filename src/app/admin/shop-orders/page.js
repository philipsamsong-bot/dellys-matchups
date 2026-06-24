"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

function getStatusClass(status) {
  if (status === "paid") return "bg-green-600 text-white";
  if (status === "rejected") return "bg-red-600 text-white";
  return "bg-yellow-400 text-black";
}

function formatStatus(status) {
  return (status || "pending_confirmation").replaceAll("_", " ");
}

function isAdmin(profile) {
  return profile?.role === "admin";
}

export default function AdminShopOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadShopOrders();
  }, []);

  async function loadShopOrders() {
    setLoading(true);
    setPageError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setPageError(userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setPageError(profileError.message);
      setLoading(false);
      return;
    }

    if (!isAdmin(profile)) {
      window.location.href = "/dashboard";
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("purpose", "shop")
      .order("created_at", { ascending: false });

    if (error) {
      setPageError(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter((order) =>
      [
        order.id,
        order.customer_name,
        order.customer_email,
        order.item_name,
        order.payment_method,
        order.status,
        order.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [orders, search]);

  async function updateOrderStatus(order, status) {
    setUpdatingId(order.id);

    const { error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", order.id);

    if (error) {
      setUpdatingId(null);
      alert(error.message);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((item) =>
        item.id === order.id ? { ...item, status } : item
      )
    );

    setUpdatingId(null);
    alert(`Shop order marked as ${formatStatus(status)}.`);
  }

  async function deleteOrder(orderId) {
    const confirmed = confirm("Delete this shop order payment record?");
    if (!confirmed) return;

    setUpdatingId(orderId);

    const { error } = await supabase.from("payments").delete().eq("id", orderId);

    if (error) {
      setUpdatingId(null);
      alert(error.message);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.filter((order) => order.id !== orderId)
    );

    setUpdatingId(null);
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <a href="/dashboard" className="font-bold text-white/70 hover:text-white">
            ← Back to Dashboard
          </a>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">
            Shop Orders
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            View and manage all book, merch, and shop orders submitted through
            checkout.
          </p>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shop orders by name, email, item, method, status or notes..."
            className="mt-8 h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
          />

          <div className="mt-14 overflow-hidden rounded-[3rem] bg-white text-black shadow-2xl">
            {loading ? (
              <div className="p-10 text-center font-bold">
                Loading shop orders...
              </div>
            ) : pageError ? (
              <div className="p-10 text-center">
                <p className="font-black text-[#b30018]">
                  Unable to load shop orders
                </p>
                <p className="mt-3 text-black/70">{pageError}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center font-bold">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead className="bg-[#fff8f5] text-left">
                    <tr>
                      <th className="p-5">Order ID</th>
                      <th className="p-5">Item</th>
                      <th className="p-5">Customer</th>
                      <th className="p-5">Email</th>
                      <th className="p-5">Total</th>
                      <th className="p-5">Payment</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Date</th>
                      <th className="p-5">Proof</th>
                      <th className="p-5">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-t border-black/10">
                        <td className="p-5 font-black text-[#b30018]">
                          {order.id.slice(0, 8)}
                        </td>

                        <td className="p-5 font-bold">
                          {order.item_name || "Shop Item"}
                        </td>

                        <td className="p-5 font-bold">
                          {order.customer_name || "Unknown"}
                        </td>

                        <td className="p-5 text-black/70">
                          {order.customer_email || "No email"}
                        </td>

                        <td className="p-5 font-black text-[#b30018]">
                          {order.currency || "USD"} {order.amount}
                        </td>

                        <td className="p-5">{order.payment_method || "N/A"}</td>

                        <td className="p-5">
                          <span
                            className={`rounded-full px-4 py-2 text-sm font-black capitalize ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>

                        <td className="p-5 text-black/60">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td className="p-5">
                          {order.proof_url ? (
                            <a
                              href={order.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-[#b30018] px-5 py-3 text-sm font-black text-white"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="text-black/50">No proof</span>
                          )}
                        </td>

                        <td className="p-5">
                          <div className="flex flex-wrap gap-2">
                            {order.status !== "paid" && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() => updateOrderStatus(order, "paid")}
                                className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}

                            {order.status !== "rejected" && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() =>
                                  updateOrderStatus(order, "rejected")
                                }
                                className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={updatingId === order.id}
                              onClick={() => deleteOrder(order.id)}
                              className="rounded-full bg-black px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                            >
                              Delete
                            </button>

                            {updatingId === order.id && (
                              <p className="w-full text-xs text-black/50">
                                Updating...
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-black/10 p-6">
                  <p className="font-black text-[#b30018]">Order Notes</p>

                  <div className="mt-4 grid gap-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={`${order.id}-notes`}
                        className="rounded-2xl bg-[#fff8f5] p-5"
                      >
                        <p className="font-black">
                          {order.item_name || "Shop Item"} —{" "}
                          {order.customer_name || "Unknown"}
                        </p>

                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-black/70">
                          {order.notes || "No notes provided."}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
