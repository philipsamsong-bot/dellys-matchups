import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const sessionId = searchParams.get("session_id");

    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ["line_items"],
      }
    );

    const plan =
      session.line_items.data[0].price.id;

    return NextResponse.json({
      plan,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
