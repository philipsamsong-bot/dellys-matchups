// src/app/api/paypal/webhook/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE ||
  "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_WEBHOOK_ID =
  process.env.PAYPAL_WEBHOOK_ID;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const VALID_PLANS = new Set([
  "premium",
  "vip",
]);

const ACTIVE_SUBSCRIPTION_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
]);

const INACTIVE_SUBSCRIPTION_EVENTS = {
  "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
  "BILLING.SUBSCRIPTION.SUSPENDED": "suspended",
  "BILLING.SUBSCRIPTION.EXPIRED": "expired",
};

function getRequiredEnvironmentVariable(
  value,
  name,
) {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`,
    );
  }

  return value;
}

function createSupabaseAdmin() {
  return createClient(
    getRequiredEnvironmentVariable(
      SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    getRequiredEnvironmentVariable(
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

function parseCustomId(customId) {
  if (typeof customId !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(customId);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function getString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizePlan(value) {
  return getString(value).toLowerCase();
}

function getWebhookHeaders(request) {
  return {
    transmissionId: request.headers.get(
      "paypal-transmission-id",
    ),
    transmissionTime: request.headers.get(
      "paypal-transmission-time",
    ),
    transmissionSignature: request.headers.get(
      "paypal-transmission-sig",
    ),
    certificateUrl: request.headers.get(
      "paypal-cert-url",
    ),
    authenticationAlgorithm:
      request.headers.get(
        "paypal-auth-algo",
      ),
  };
}

function hasRequiredWebhookHeaders(headers) {
  return Boolean(
    headers.transmissionId &&
      headers.transmissionTime &&
      headers.transmissionSignature &&
      headers.certificateUrl &&
      headers.authenticationAlgorithm,
  );
}

async function getPayPalAccessToken() {
  const clientId =
    getRequiredEnvironmentVariable(
      PAYPAL_CLIENT_ID,
      "PAYPAL_CLIENT_ID",
    );

  const clientSecret =
    getRequiredEnvironmentVariable(
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
        Authorization:
          `Basic ${authentication}`,
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

async function verifyPayPalWebhook(
  request,
  event,
) {
  const webhookId =
    getRequiredEnvironmentVariable(
      PAYPAL_WEBHOOK_ID,
      "PAYPAL_WEBHOOK_ID",
    );

  const headers =
    getWebhookHeaders(request);

  if (
    !hasRequiredWebhookHeaders(headers)
  ) {
    return false;
  }

  const accessToken =
    await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        auth_algo:
          headers.authenticationAlgorithm,
        cert_url:
          headers.certificateUrl,
        transmission_id:
          headers.transmissionId,
        transmission_sig:
          headers.transmissionSignature,
        transmission_time:
          headers.transmissionTime,
        webhook_id:
          webhookId,
        webhook_event:
          event,
      }),
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "PAYPAL WEBHOOK VERIFICATION ERROR:",
      data,
    );

    return false;
  }

  return (
    data.verification_status ===
    "SUCCESS"
  );
}

async function updateProfileMembership(
  supabaseAdmin,
  userId,
  updates,
) {
  const { data, error } =
    await supabaseAdmin
      .from("profiles")
      .update({
        ...updates,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "The membership profile could not be updated.",
    );
  }
}

async function activateMembership({
  supabaseAdmin,
  userId,
  plan,
  subscriptionId,
}) {
  await updateProfileMembership(
    supabaseAdmin,
    userId,
    {
      membership_plan: plan,
      subscription_status: "active",
      paypal_subscription_id:
        subscriptionId || null,
      vip_badge: plan === "vip",
    },
  );
}

async function deactivateMembership({
  supabaseAdmin,
  userId,
  subscriptionStatus,
}) {
  await updateProfileMembership(
    supabaseAdmin,
    userId,
    {
      membership_plan: "free",
      subscription_status:
        subscriptionStatus,
      vip_badge: false,
    },
  );
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    let event;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid PayPal webhook payload.",
        },
        {
          status: 400,
        },
      );
    }

    const verified =
      await verifyPayPalWebhook(
        request,
        event,
      );

    if (!verified) {
      console.warn(
        "PAYPAL WEBHOOK REJECTED: signature verification failed.",
      );

      return NextResponse.json(
        {
          error:
            "Invalid PayPal webhook signature.",
        },
        {
          status: 400,
        },
      );
    }

    const eventType =
      getString(event?.event_type);

    const resource =
      event?.resource &&
      typeof event.resource === "object" &&
      !Array.isArray(event.resource)
        ? event.resource
        : {};

    const customData =
      parseCustomId(
        resource.custom_id,
      );

    const userId =
      getString(customData.userId);

    const plan =
      normalizePlan(
        customData.plan,
      );

    const subscriptionId =
      getString(resource.id);

    if (
      !userId ||
      !VALID_PLANS.has(plan)
    ) {
      return NextResponse.json({
        received: true,
        processed: false,
        reason:
          "No valid Matchups membership metadata was found.",
      });
    }

    const supabaseAdmin =
      createSupabaseAdmin();

    if (
      ACTIVE_SUBSCRIPTION_EVENTS.has(
        eventType,
      )
    ) {
      await activateMembership({
        supabaseAdmin,
        userId,
        plan,
        subscriptionId,
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action:
          "membership_activated",
        plan,
        subscriptionId:
          subscriptionId || null,
      });
    }

    const inactiveStatus =
      INACTIVE_SUBSCRIPTION_EVENTS[
        eventType
      ];

    if (inactiveStatus) {
      await deactivateMembership({
        supabaseAdmin,
        userId,
        subscriptionStatus:
          inactiveStatus,
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action:
          "membership_deactivated",
        subscriptionStatus:
          inactiveStatus,
      });
    }

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    ) {
      await updateProfileMembership(
        supabaseAdmin,
        userId,
        {
          subscription_status:
            "payment_failed",
          paypal_subscription_id:
            subscriptionId || null,
        },
      );

      return NextResponse.json({
        received: true,
        processed: true,
        action:
          "subscription_payment_failed",
      });
    }

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.UPDATED"
    ) {
      await updateProfileMembership(
        supabaseAdmin,
        userId,
        {
          paypal_subscription_id:
            subscriptionId || null,
        },
      );

      return NextResponse.json({
        received: true,
        processed: true,
        action:
          "subscription_updated",
      });
    }

    return NextResponse.json({
      received: true,
      processed: false,
      eventType,
    });
  } catch (error) {
    console.error(
      "PAYPAL WEBHOOK ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process PayPal webhook.",
      },
      {
        status: 500,
      },
    );
  }
}
