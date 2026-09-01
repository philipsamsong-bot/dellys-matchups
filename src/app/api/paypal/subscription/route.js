// src/app/api/paypal/subscription/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_PLAN_IDS = {
  premium: process.env.PAYPAL_PREMIUM_PLAN_ID,
  vip: process.env.PAYPAL_VIP_PLAN_ID,
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const VALID_PLANS = new Set(["premium", "vip"]);

function getRequiredEnv(value, name) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseAdmin() {
  return createClient(
    getRequiredEnv(
      SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    getRequiredEnv(
      SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function getBearerToken(request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  return token || null;
}

async function getAuthenticatedUser(request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const supabaseAdmin = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return {
      user: null,
      error: "Invalid or expired session.",
    };
  }

  return {
    user,
    error: null,
  };
}

async function getPayPalAccessToken() {
  const clientId = getRequiredEnv(
    PAYPAL_CLIENT_ID,
    "PAYPAL_CLIENT_ID",
  );

  const clientSecret = getRequiredEnv(
    PAYPAL_CLIENT_SECRET,
    "PAYPAL_CLIENT_SECRET",
  );

  const authentication = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authentication}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.message ||
        "Unable to authenticate with PayPal.",
    );
  }

  if (!data.access_token) {
    throw new Error(
      "PayPal did not return an access token.",
    );
  }

  return data.access_token;
}

function getSiteUrl() {
  return getRequiredEnv(
    SITE_URL,
    "NEXT_PUBLIC_SITE_URL",
  ).replace(/\/+$/, "");
}

export async function POST(request) {
  try {
    const { user, error: authError } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const plan = String(
      body?.plan || "",
    )
      .trim()
      .toLowerCase();

    if (!VALID_PLANS.has(plan)) {
      return NextResponse.json(
        {
          error: "Invalid membership plan.",
        },
        {
          status: 400,
        },
      );
    }

    const planId = PAYPAL_PLAN_IDS[plan];

    if (!planId) {
      return NextResponse.json(
        {
          error: `Missing PayPal plan ID for ${plan}.`,
        },
        {
          status: 500,
        },
      );
    }

    const siteUrl = getSiteUrl();
    const accessToken =
      await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          plan_id: planId,

          custom_id: JSON.stringify({
            userId: user.id,
            plan,
          }),

          subscriber: user.email
            ? {
                email_address: user.email,
              }
            : undefined,

          application_context: {
            brand_name: "Delly's Matchups",
            user_action: "SUBSCRIBE_NOW",
            return_url:
              `${siteUrl}/payment-success?plan=${encodeURIComponent(plan)}`,
            cancel_url:
              `${siteUrl}/payment-cancelled`,
          },
        }),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "PAYPAL SUBSCRIPTION CREATE ERROR:",
        data,
      );

      return NextResponse.json(
        {
          error:
            data.message ||
            data.error_description ||
            "Unable to create PayPal subscription.",
          details: data,
        },
        {
          status: 502,
        },
      );
    }

    const approveLink = data.links?.find(
      (link) =>
        link.rel === "approve" &&
        typeof link.href === "string",
    );

    if (!approveLink?.href) {
      return NextResponse.json(
        {
          error:
            "PayPal approval URL was not returned.",
        },
        {
          status: 502,
        },
      );
    }

    if (!data.id) {
      return NextResponse.json(
        {
          error:
            "PayPal subscription ID was not returned.",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      url: approveLink.href,
      subscriptionId: data.id,
      plan,
    });
  } catch (error) {
    console.error(
      "PAYPAL SUBSCRIPTION ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create PayPal subscription.",
      },
      {
        status: 500,
      },
    );
  }
}
