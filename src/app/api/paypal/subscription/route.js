import { NextResponse } from "next/server";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_PLAN_IDS = {
  premium: process.env.PAYPAL_PREMIUM_PLAN_ID,
  vip: process.env.PAYPAL_VIP_PLAN_ID,
};

function getRequiredEnv(value, name) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function getPayPalAccessToken() {
  const clientId = getRequiredEnv(PAYPAL_CLIENT_ID, "PAYPAL_CLIENT_ID");
  const clientSecret = getRequiredEnv(
    PAYPAL_CLIENT_SECRET,
    "PAYPAL_CLIENT_SECRET"
  );

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

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
    throw new Error(
      data.error_description || data.message || "Unable to authenticate PayPal."
    );
  }

  return data.access_token;
}

export async function POST(request) {
  try {
    const { plan, userId, email } = await request.json();

    if (!["premium", "vip"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid membership plan." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID." },
        { status: 400 }
      );
    }

    const planId = PAYPAL_PLAN_IDS[plan];

    if (!planId) {
      return NextResponse.json(
        { error: `Missing PayPal plan ID for ${plan}.` },
        { status: 500 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
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
            email: email || null,
          }),
          application_context: {
            brand_name: "Delly's Matchups",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${origin}/payment-success?plan=${plan}`,
            cancel_url: `${origin}/payment-cancelled`,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error_description ||
            "Unable to create PayPal subscription.",
          details: data,
        },
        { status: 500 }
      );
    }

    const approveLink = data.links?.find((link) => link.rel === "approve");

    if (!approveLink?.href) {
      return NextResponse.json(
        { error: "PayPal approval URL was not returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: approveLink.href,
      subscriptionId: data.id,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
