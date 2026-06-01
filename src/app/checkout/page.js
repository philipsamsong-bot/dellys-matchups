"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function CheckoutPage() {
  const paypalRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    note: "",
  });

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("dm-cart") || "[]");
    setCart(savedCart);
  }, []);

  const total = cart.reduce((sum, item) => {
    return sum + Number(String(item.price).replace("$", ""));
  }, 0);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function validateOrder() {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return false;
    }

    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.country
    ) {
      alert("Please complete all required delivery details.");
      return false;
    }

    return true;
  }

  async function saveOrder(paymentData) {
    const response = await fetch("/api/shop/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cart,
        customer: form,
        total,
        payment: paymentData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to save order.");
    }

    return data;
  }

  useEffect(() => {
    if (!paypalClientId || !paypalRef.current || cart.length === 0) return;

    paypalRef.current.innerHTML = "";

    function renderButtons() {
      if (!window.paypal || !paypalRef.current) return;

      paypalRef.current.innerHTML = "";

      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "pill",
            label: "paypal",
          },

          createOrder(data, actions) {
            if (!validateOrder()) {
              return Promise.reject(new Error("Order details incomplete."));
            }

            return actions.order.create({
              purchase_units: [
                {
                  description: "Delly's Matchups Shop Order",
                  amount: {
                    currency_code: "USD",
                    value: total.toFixed(2),
                  },
                },
              ],
            });
          },

          onApprove(data, actions) {
            return actions.order.capture().then(async (details) => {
              try {
                setIsSubmitting(true);

                await saveOrder({
                  method: "paypal",
                  status: "paid",
                  paypalOrderId: data.orderID,
                  paypalPayerId: data.payerID,
                  paidAmount:
                    details.purchase_units?.[0]?.amount?.value ||
                    total.toFixed(2),
                  paidAt: new Date().toISOString(),
                });
                
                localStorage.setItem(
                  "shopCustomerName",
                  form.fullName.split("")[0]
                );

                localStorage.removeItem("dm-cart");
                window.dispatchEvent(new Event("cartUpdated"));
                
                const firstName =
                form.fullName.trim().split(" ")[0];
                
                window.location.href = `/shop/payment-success?name=${encodeURIComponent(firstName)}`;
              } catch (error) {
                alert(error.message);
              } finally {
                setIsSubmitting(false);
              }
            });
          },

          onCancel() {
            alert("Payment cancelled.");
          },

          onError(error) {
            console.error(error);
            alert("PayPal payment failed. Please try again.");
          },
        })
        .render(paypalRef.current);
    }

    const existingScript = document.querySelector("#paypal-sdk");

    if (existingScript) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
    script.async = true;
    script.onload = renderButtons;

    document.body.appendChild(script);
  }, [paypalClientId, cart, total, form]);

  async function handleMomoSubmit() {
    if (!validateOrder()) return;

    try {
      setIsSubmitting(true);

      await saveOrder({
        method: "mtn_momo",
        status: "pending_verification",
        momoNumber: "+237 676 25 71 87",
        submittedAt: new Date().toISOString(),
      });

      localStorage.removeItem("dm-cart");
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/shop/payment-pending";
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-gradient-to-br from-[#7a0010] via-[#b30018] to-[#ff4d6d] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Secure Checkout
            </p>

            <h1 className="font-display mt-6 text-7xl font-bold leading-none">
              Complete Your Order
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
              Enter your delivery details and review your order before payment.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-[3rem] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
              <h2 className="font-display text-5xl font-bold">
                Delivery Details
              </h2>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Email address"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="Phone number"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  placeholder="City"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
                />

                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  required
                  placeholder="Country"
                  className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
                />

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="Full delivery address"
                  className="min-h-36 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
                />

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Order note optional"
                  className="min-h-32 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
                />
              </div>
            </div>

            <div className="h-fit rounded-[3rem] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                Order Summary
              </p>

              <h2 className="font-display mt-5 text-5xl font-bold">
                Your Items
              </h2>

              {cart.length === 0 ? (
                <div className="mt-10 rounded-[2rem] bg-white/10 p-8 text-center">
                  <p className="text-white/80">Your cart is empty.</p>

                  <a
                    href="/shop/books"
                    className="mt-6 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
                  >
                    Browse Books
                  </a>
                </div>
              ) : (
                <div className="mt-10 space-y-6">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex gap-4 rounded-[2rem] bg-white/10 p-4"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-24 w-20 rounded-xl bg-white object-contain p-2"
                      />

                      <div className="flex-1">
                        <p className="font-bold">{item.title}</p>
                        <p className="mt-2 text-red-100">{item.price}</p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-white/15 pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-white/75">Items</p>
                      <p className="font-bold">{cart.length}</p>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-white/75">Delivery</p>
                      <p className="font-bold">Calculated Later</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-6">
                      <p className="text-xl font-bold">Total</p>
                      <p className="text-4xl font-black text-white">
                        ${total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[2rem] bg-white p-5">
                    {!paypalClientId ? (
                      <p className="font-bold text-[#b30018]">
                        Missing PayPal Client ID. Add
                        NEXT_PUBLIC_PAYPAL_CLIENT_ID to .env.local.
                      </p>
                    ) : (
                      <div ref={paypalRef} />
                    )}
                  </div>

                  <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                      MTN Mobile Money
                    </p>

                    <p className="mt-4 text-white/80">
                      Pay manually using:
                    </p>

                    <p className="mt-3 text-3xl font-black">
                      +237 676 25 71 87
                    </p>

                    <p className="mt-4 text-sm leading-7 text-white/70">
                      After payment, send your transaction ID or screenshot to
                      our WhatsApp number for verification.
                    </p>

                    <button
                      type="button"
                      onClick={handleMomoSubmit}
                      disabled={isSubmitting}
                      className="mt-6 w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                    >
                      I Paid With MTN MoMo
                    </button>
                  </div>

                  <a
                    href="/cart"
                    className="block text-center text-sm font-bold text-white/70 hover:text-white"
                  >
                    Back To Cart
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
