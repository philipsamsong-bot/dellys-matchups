// src/app/api/shop/order-status/route.js

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL;

const ALLOWED_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

const EMAIL_STATUSES = new Set([
  "processing",
  "shipped",
  "delivered",
]);

class AdminAuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

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

function getString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getAuthorizationToken(
  request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

async function requireAdmin(
  request,
  supabaseAdmin,
) {
  const token =
    getAuthorizationToken(
      request,
    );

  if (!token) {
    throw new AdminAuthError(
      "Not authenticated.",
      401,
    );
  }

  const {
    data: { user },
    error: authError,
  } =
    await supabaseAdmin.auth.getUser(
      token,
    );

  if (
    authError ||
    !user
  ) {
    throw new AdminAuthError(
      "Invalid session.",
      401,
    );
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  if (profileError) {
    console.error(
      "SHOP ORDERS ADMIN PROFILE ERROR:",
      profileError,
    );

    throw new Error(
      "Unable to verify admin access.",
    );
  }

  if (
    profile?.role !==
    "admin"
  ) {
    throw new AdminAuthError(
      "Admin access required.",
      403,
    );
  }

  return user;
}

function handleRouteError(
  error,
  label,
) {
  if (
    error instanceof
    AdminAuthError
  ) {
    return Response.json(
      {
        error:
          error.message,
      },
      {
        status:
          error.status,
      },
    );
  }

  console.error(
    label,
    error,
  );

  return Response.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unexpected server error.",
    },
    {
      status: 500,
    },
  );
}

async function sendOrderStatusEmail(
  order,
  status,
) {
  if (
    !EMAIL_STATUSES.has(
      status,
    )
  ) {
    return;
  }

  if (
    !RESEND_API_KEY ||
    !RESEND_FROM_EMAIL
  ) {
    console.warn(
      "SHOP ORDER STATUS EMAIL SKIPPED: Resend environment variables are not configured.",
    );

    return;
  }

  if (
    !order.customer_email
  ) {
    console.warn(
      "SHOP ORDER STATUS EMAIL SKIPPED: Order has no customer email.",
    );

    return;
  }

  const resend =
    new Resend(
      RESEND_API_KEY,
    );

  try {
    await resend.emails.send({
      from:
        `DMs Orders <${RESEND_FROM_EMAIL}>`,

      to:
        order.customer_email,

      subject:
        `Your Delly's Matchups order is now ${status}`,

      html: `
        <h2>Order Update</h2>
        <p>Hello ${order.customer_name || "Customer"},</p>
        <p>Your order status has been updated.</p>
        <p><strong>Order Number:</strong> ${
          order.order_number ||
          order.id
        }</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p>Thank you for shopping with Delly's Matchups.</p>
      `,
    });
  } catch (error) {
    console.error(
      "SHOP ORDER STATUS EMAIL ERROR:",
      error,
    );
  }
}

export async function GET(
  request,
) {
  try {
    const supabaseAdmin =
      createSupabaseAdmin();

    await requireAdmin(
      request,
      supabaseAdmin,
    );

    const {
      searchParams,
    } =
      new URL(
        request.url,
      );

    const orderId =
      getString(
        searchParams.get(
          "id",
        ),
      );

    if (orderId) {
      const {
        data: order,
        error,
      } =
        await supabaseAdmin
          .from(
            "shop_orders",
          )
          .select("*")
          .eq(
            "id",
            orderId,
          )
          .maybeSingle();

      if (error) {
        console.error(
          "SHOP ORDER GET ERROR:",
          error,
        );

        return Response.json(
          {
            error:
              "Unable to load Shop order.",
          },
          {
            status: 500,
          },
        );
      }

      if (!order) {
        return Response.json(
          {
            error:
              "Shop order was not found.",
          },
          {
            status: 404,
          },
        );
      }

      return Response.json({
        order,
      });
    }

    const {
      data: orders,
      error,
    } =
      await supabaseAdmin
        .from(
          "shop_orders",
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        );

    if (error) {
      console.error(
        "SHOP ORDERS GET ERROR:",
        error,
      );

      return Response.json(
        {
          error:
            "Unable to load Shop orders.",
        },
        {
          status: 500,
        },
      );
    }

    return Response.json({
      orders:
        orders || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "SHOP ORDERS GET ERROR:",
    );
  }
}

export async function POST(
  request,
) {
  try {
    const supabaseAdmin =
      createSupabaseAdmin();

    await requireAdmin(
      request,
      supabaseAdmin,
    );

    const body =
      await request.json();

    const orderId =
      getString(
        body.orderId,
      );

    const status =
      getString(
        body.status,
      ).toLowerCase();

    if (
      !orderId ||
      !status
    ) {
      return Response.json(
        {
          error:
            "Order ID and status are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !ALLOWED_STATUSES.has(
        status,
      )
    ) {
      return Response.json(
        {
          error:
            "Order status must be paid, processing, shipped, delivered, cancelled or refunded.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: currentOrder,
      error: lookupError,
    } =
      await supabaseAdmin
        .from(
          "shop_orders",
        )
        .select("*")
        .eq(
          "id",
          orderId,
        )
        .maybeSingle();

    if (lookupError) {
      console.error(
        "SHOP ORDER LOOKUP ERROR:",
        lookupError,
      );

      return Response.json(
        {
          error:
            "Unable to load Shop order.",
        },
        {
          status: 500,
        },
      );
    }

    if (!currentOrder) {
      return Response.json(
        {
          error:
            "Shop order was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      currentOrder.status ===
      status
    ) {
      return Response.json({
        success: true,
        alreadyUpdated:
          true,
        order:
          currentOrder,
      });
    }

    const {
      data: order,
      error: updateError,
    } =
      await supabaseAdmin
        .from(
          "shop_orders",
        )
        .update({
          status,
        })
        .eq(
          "id",
          orderId,
        )
        .select("*")
        .maybeSingle();

    if (updateError) {
      console.error(
        "SHOP ORDER STATUS UPDATE ERROR:",
        updateError,
      );

      return Response.json(
        {
          error:
            "Unable to update Shop order status.",
        },
        {
          status: 500,
        },
      );
    }

    if (!order) {
      return Response.json(
        {
          error:
            "Shop order was not found.",
        },
        {
          status: 404,
        },
      );
    }

    await sendOrderStatusEmail(
      order,
      status,
    );

    return Response.json({
      success: true,
      alreadyUpdated:
        false,
      order,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "SHOP ORDER STATUS UPDATE ERROR:",
    );
  }
}
