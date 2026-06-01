"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function AdminShopOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setOrders(data || []);
      setLoading(false);
    }

    fetchOrders();
  }, []);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Admin
          </p>

          <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">
            Shop Orders
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            View and manage all book, merch, and shop orders.
          </p>

          <div className="mt-14 overflow-hidden rounded-[3rem] bg-white text-black shadow-2xl">
            {loading ? (
              <div className="p-10 text-center font-bold">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center font-bold">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead className="bg-[#fff8f5] text-left">
                    <tr>
                      <th className="p-5">Customer</th>
                      <th className="p-5">Email</th>
                      <th className="p-5">Total</th>
                      <th className="p-5">Payment</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Date</th>
                      <th className="p-5">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-black/10">
                        <td className="p-5 font-bold">
                          {order.customer_name || "Unknown"}
                        </td>

                        <td className="p-5 text-black/70">
                          {order.customer_email}
                        </td>

                        <td className="p-5 font-black text-[#b30018]">
                          ${order.total_amount}
                        </td>

                        <td className="p-5 capitalize">
                          {order.payment_method}
                        </td>

                        <td className="p-5">
                          <span className="rounded-full bg-[#b30018] px-4 py-2 text-sm font-black capitalize text-white">
                            {order.status || order.payment_status || "paid"}
                          </span>
                        </td>

                        <td className="p-5 text-black/60">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>

                        <td className="p-5">
                          <Link
                            href={`/admin/shop-orders/${order.id}`}
                            className="rounded-full bg-[#b30018] px-5 py-3 text-sm font-black text-white"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
