import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { cart, customer } = await request.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty." },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const lineItems = cart.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: item.image ? [`${siteUrl}${item.image}`] : [],
        },
        unit_amount: Math.round(
          Number(String(item.price).replace("$", "")) * 100
        ),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success`,
      cancel_url: `${siteUrl}/cart`,
      metadata: {
        type: "shop",
        customerName: customer.fullName,
        phone: customer.phone,
        city: customer.city,
        country: customer.country,
        address: customer.address,
        note: customer.note || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to create checkout session." },
      { status: 500 }
    );
  }
}
