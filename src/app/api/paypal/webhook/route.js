import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.metadata?.type === "shop") {
      await supabase.from("orders").insert({
        stripe_session_id: session.id,
        customer_email: session.customer_email,
        customer_name: session.metadata.customerName,
        phone: session.metadata.phone,
        address: session.metadata.address,
        city: session.metadata.city,
        country: session.metadata.country,
        note: session.metadata.note || "",
        total_amount: session.amount_total / 100,
        currency: session.currency,
        payment_status: session.payment_status,
        order_status: "paid",
      });

      return NextResponse.json({ received: true });
    }

    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    if (userId && plan) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_plan: plan,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
