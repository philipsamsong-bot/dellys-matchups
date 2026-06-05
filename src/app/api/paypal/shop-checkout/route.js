import { NextResponse } from "next/server";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_PLAN_IDS = {
  premium: "P-9TB41656290136044NIQKOFA",
  vip: "P-3NP285394S872522CNIQLBBY",
};

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Unable to authenticate PayPal.");
  }

  return data.access_token;
}

export async function POST(request) {
  try {
    const { plan, userId, email } = await request.json();

    const planId = PAYPAL_PLAN_IDS[plan];

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "Invalid PayPal subscription request." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin");
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: JSON.stringify({
          userId,
          plan,
          email,
        }),
        application_context: {
          brand_name: "Delly's Matchups",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${origin}/payment-success?plan=${plan}`,
          cancel_url: `${origin}/payment-cancelled`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to create PayPal subscription.");
    }

    const approveLink = data.links?.find((link) => link.rel === "approve");

    if (!approveLink?.href) {
      throw new Error("PayPal approval link was not returned.");
    }

    return NextResponse.json({ url: approveLink.href });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
