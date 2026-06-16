import { NextResponse } from "next/server";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

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
    const {
      orderId,
      customerName,
      customerEmail,
      items,
      amount,
      currency = "USD",
    } = await request.json();

    if (!customerName || !customerEmail || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Missing customer details or invalid amount." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId || `shop-${Date.now()}`,
            description: "Delly's Matchups Shop Order",
            custom_id: JSON.stringify({
              orderId: orderId || null,
              customerName,
              customerEmail,
              items: items || [],
            }),
            amount: {
              currency_code: currency,
              value: Number(amount).toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Delly's Matchups",
              user_action: "PAY_NOW",
              return_url: `${origin}/shop/payment-success`,
              cancel_url: `${origin}/shop/payment-cancelled`,
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error_description ||
            "Unable to create PayPal shop order.",
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
      paypalOrderId: data.id,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
