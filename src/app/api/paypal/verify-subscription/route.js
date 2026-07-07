import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
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

function parseCustomId(customId) {
  try {
    return JSON.parse(customId || "{}");
  } catch {
    return {};
  }
}

export async function POST(request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscription ID." },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscription = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: subscription.message || "Unable to verify subscription." },
        { status: 500 }
      );
    }

    if (subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Subscription is ${subscription.status}.` },
        { status: 400 }
      );
    }

    const customData = parseCustomId(subscription.custom_id);
    const userId = customData.userId;
    const plan = customData.plan;

    if (!userId || !["premium", "vip"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid subscription metadata." },
        { status: 400 }
      );
    }

    await supabase
      .from("profiles")
      .update({
        membership_plan: plan,
        subscription_status: "active",
        paypal_subscription_id: subscriptionId,
        vip_badge: plan === "vip",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
