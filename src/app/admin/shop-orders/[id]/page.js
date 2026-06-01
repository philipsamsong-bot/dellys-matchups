"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const statuses = [
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];
export default function AdminShopOrderDetailsPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setOrder(data);
      setLoading(false);
    }

    fetchOrder();
  }, [params.id]);

  async function updateStatus(event) {
    const newStatus = event.target.value;
  
    setSaving(true);
  
    const response = await fetch("/api/shop/order-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: order.id,
        status: newStatus,
      }),
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      alert(data.error || "Unable to update status.");
      setSaving(false);
      return;
    }
  
    setOrder(data.order);
    setSaving(false);

    
  }

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-[#b30018] px-6 pt-44 text-white">
          <p className="text-center text-xl font-bold">Loading order...</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-[#b30018] px-6 pt-44 text-white">
          <p className="text-center text-xl font-bold">Order not found.</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/admin/shop-orders" className="font-bold text-red-100">
            ← Back to Orders
          </Link>

          <h1 className="font-display mt-8 text-6xl font-bold leading-none md:text-8xl">
            Order Details
          </h1>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[3rem] bg-white p-8 text-black shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                Customer
              </h2>

              <div className="mt-8 space-y-5 text-lg">
                <p>
                  <strong>Name:</strong> {order.customer_name}
                </p>
                <p>
                  <strong>Email:</strong> {order.customer_email}
                </p>
                <p>
                  <strong>Phone:</strong> {order.customer_phone}
                </p>
                <p>
                  <strong>Address:</strong> {order.address}
                </p>
                <p>
                  <strong>City:</strong> {order.city}
                </p>
                <p>
                  <strong>Country:</strong> {order.country}
                </p>
                {order.note && (
                  <p>
                    <strong>Note:</strong> {order.note}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[3rem] bg-white p-8 text-black shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                Payment
              </h2>

              <div className="mt-8 space-y-5 text-lg">
                <p>
                    <strong>Order Number:</strong>
                    {order.order_number || "N/A"}
                </p>

                <p>
                  <strong>Total:</strong>{" "}
                  <span className="font-black text-[#b30018]">
                    ${order.total_amount}
                  </span>
                </p>

                <p>
                  <strong>Payment Method:</strong> {order.payment_method}
                </p>

                <p>
                  <strong>Payment Status:</strong> {order.payment_status}
                </p>

                <p>
                  <strong>PayPal Order ID:</strong>{" "}
                  {order.paypal_order_id || "Not available"}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(order.created_at).toLocaleString()}
                </p>

                <div>
                  <label className="block font-bold">Order Status</label>

                  <select
                    value={order.status || "paid"}
                    onChange={updateStatus}
                    className="mt-3 h-14 w-full rounded-2xl border border-black/10 px-5 outline-none"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
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

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {(order.items || []).map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex gap-5 rounded-[2rem] bg-[#fff8f5] p-5"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-28 w-24 rounded-xl bg-white object-contain p-2"
                  />

                  <div>
                    <p className="text-xl font-black">{item.title}</p>
                    <p className="mt-2 text-lg font-black text-[#b30018]">
                      {item.price}
                    </p>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-black/50">
                      {item.type || "product"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}