// src/app/api/paypal/webhook/route.js

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE ||
  "https://api-m.paypal.com";

const ACTIVE_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
]);

const INACTIVE_EVENTS = new Map([
  [
    "BILLING.SUBSCRIPTION.CANCELLED",
    "cancelled",
  ],
  [
    "BILLING.SUBSCRIPTION.SUSPENDED",
    "suspended",
  ],
  [
    "BILLING.SUBSCRIPTION.EXPIRED",
    "expired",
  ],
]);

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server environment variables are missing.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function getPayPalCredentials() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID;

  const clientSecret =
    process.env.PAYPAL_CLIENT_SECRET;

  const webhookId =
    process.env.PAYPAL_WEBHOOK_ID;

  if (
    !clientId ||
    !clientSecret ||
    !webhookId
  ) {
    throw new Error(
      "PayPal webhook environment variables are missing.",
    );
  }

  return {
    clientId,
    clientSecret,
    webhookId,
  };
}

async function getPayPalAccessToken() {
  const {
    clientId,
    clientSecret,
  } = getPayPalCredentials();

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (
    !response.ok ||
    !data?.access_token
  ) {
    console.error(
      "PAYPAL WEBHOOK TOKEN ERROR:",
      data,
    );

    throw new Error(
      "Unable to authenticate with PayPal.",
    );
  }

  return data.access_token;
}

async function verifyPayPalWebhook(
  request,
  webhookEvent,
) {
  const { webhookId } =
    getPayPalCredentials();

  const accessToken =
    await getPayPalAccessToken();

  const transmissionId =
    request.headers.get(
      "paypal-transmission-id",
    );

  const transmissionTime =
    request.headers.get(
      "paypal-transmission-time",
    );

  const certUrl =
    request.headers.get(
      "paypal-cert-url",
    );

  const authAlgo =
    request.headers.get(
      "paypal-auth-algo",
    );

  const transmissionSig =
    request.headers.get(
      "paypal-transmission-sig",
    );

  if (
    !transmissionId ||
    !transmissionTime ||
    !certUrl ||
    !authAlgo ||
    !transmissionSig
  ) {
    throw new Error(
      "Required PayPal webhook headers are missing.",
    );
  }

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
        transmission_id:
          transmissionId,
        transmission_time:
          transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig:
          transmissionSig,
        webhook_id: webhookId,
        webhook_event:
          webhookEvent,
      }),
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (
    !response.ok ||
    data?.verification_status !==
      "SUCCESS"
  ) {
    console.error(
      "PAYPAL WEBHOOK VERIFY ERROR:",
      data,
    );

    return false;
  }

  return true;
}

function parseCustomId(resource) {
  const rawCustomId =
    resource?.custom_id;

  if (!rawCustomId) {
    return null;
  }

  try {
    const parsed =
      typeof rawCustomId ===
      "string"
        ? JSON.parse(rawCustomId)
        : rawCustomId;

    const userId = String(
      parsed?.userId || "",
    ).trim();

    const plan = String(
      parsed?.plan || "",
    )
      .trim()
      .toLowerCase();

    if (
      !userId ||
      !["premium", "vip"].includes(
        plan,
      )
    ) {
      return null;
    }

    return {
      userId,
      plan,
    };
  } catch {
    return null;
  }
}

async function updateProfileMembership(
  supabaseAdmin,
  userId,
  updates,
) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("profiles")
    .update({
      ...updates,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id");

  if (error) {
    throw error;
  }

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    throw new Error(
      `No profile found for user ${userId}.`,
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
      plan,
      membership_plan: plan,
      subscription: plan,
      subscription_status:
        "active",
      paypal_subscription_id:
        subscriptionId || null,
      vip_badge: plan === "vip",
    },
  );
}

async function deactivateMembership({
  supabaseAdmin,
  userId,
  subscriptionId,
  inactiveStatus,
}) {
  await updateProfileMembership(
    supabaseAdmin,
    userId,
    {
      plan: "free",
      membership_plan: "free",
      subscription: "free",
      subscription_status:
        inactiveStatus,
      paypal_subscription_id:
        subscriptionId || null,
      vip_badge: false,
    },
  );
}

async function handleSubscriptionUpdated({
  supabaseAdmin,
  userId,
  plan,
  subscriptionId,
  resource,
}) {
  const status = String(
    resource?.status || "",
  )
    .trim()
    .toUpperCase();

  if (status === "ACTIVE") {
    await activateMembership({
      supabaseAdmin,
      userId,
      plan,
      subscriptionId,
    });

    return;
  }

  if (
    [
      "CANCELLED",
      "SUSPENDED",
      "EXPIRED",
    ].includes(status)
  ) {
    await deactivateMembership({
      supabaseAdmin,
      userId,
      subscriptionId,
      inactiveStatus:
        status.toLowerCase(),
    });

    return;
  }

  await updateProfileMembership(
    supabaseAdmin,
    userId,
    {
      subscription_status:
        status
          ? status.toLowerCase()
          : "updated",
      paypal_subscription_id:
        subscriptionId || null,
    },
  );
}

export async function POST(request) {
  try {
    const webhookEvent =
      await request.json();

    const verified =
      await verifyPayPalWebhook(
        request,
        webhookEvent,
      );

    if (!verified) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid PayPal webhook signature.",
        },
        {
          status: 400,
        },
      );
    }

    const eventType = String(
      webhookEvent?.event_type || "",
    ).trim();

    const resource =
      webhookEvent?.resource || {};

    const subscriptionId = String(
      resource?.id || "",
    ).trim();

    const custom =
      parseCustomId(resource);

    if (!custom) {
      console.info(
        "PAYPAL WEBHOOK IGNORED: no valid Matchups custom_id",
        {
          eventType,
          subscriptionId,
        },
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    const {
      userId,
      plan,
    } = custom;

    const supabaseAdmin =
      getSupabaseAdmin();

    if (
      ACTIVE_EVENTS.has(
        eventType,
      )
    ) {
      await activateMembership({
        supabaseAdmin,
        userId,
        plan,
        subscriptionId,
      });

      console.info(
        "PAYPAL MEMBERSHIP ACTIVATED:",
        {
          userId,
          plan,
          subscriptionId,
          eventType,
        },
      );

      return NextResponse.json({
        ok: true,
        action: "activated",
      });
    }

    const inactiveStatus =
      INACTIVE_EVENTS.get(
        eventType,
      );

    if (inactiveStatus) {
      await deactivateMembership({
        supabaseAdmin,
        userId,
        subscriptionId,
        inactiveStatus,
      });

      console.info(
        "PAYPAL MEMBERSHIP DEACTIVATED:",
        {
          userId,
          subscriptionId,
          status:
            inactiveStatus,
          eventType,
        },
      );

      return NextResponse.json({
        ok: true,
        action: "deactivated",
      });
    }

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    ) {
      await deactivateMembership({
        supabaseAdmin,
        userId,
        subscriptionId,
        inactiveStatus:
          "payment_failed",
      });

      console.info(
        "PAYPAL MEMBERSHIP PAYMENT FAILED:",
        {
          userId,
          subscriptionId,
        },
      );

      return NextResponse.json({
        ok: true,
        action:
          "payment_failed",
      });
    }

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.UPDATED"
    ) {
      await handleSubscriptionUpdated({
        supabaseAdmin,
        userId,
        plan,
        subscriptionId,
        resource,
      });

      return NextResponse.json({
        ok: true,
        action: "updated",
      });
    }

    console.info(
      "PAYPAL WEBHOOK IGNORED:",
      {
        eventType,
        userId,
        subscriptionId,
      },
    );

    return NextResponse.json({
      ok: true,
      ignored: true,
    });
  } catch (error) {
    console.error(
      "PAYPAL WEBHOOK ERROR:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      {
        status: 500,
      },
    );
  }
}
