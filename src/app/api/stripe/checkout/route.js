import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { plan, userId } = await request.json();

    const priceId =
      plan === "premium"
        ? process.env.STRIPE_PREMIUM_PRICE_ID
        : plan === "vip"
        ? process.env.STRIPE_VIP_PRICE_ID
        : null;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "Invalid checkout request." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}