// src/app/api/admin/counselling-bookings/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ADMIN_STATUSES = new Set([
  "completed",
  "cancelled",
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

function getAuthorizationToken(request) {
  const authorization =
    request.headers.get("authorization");

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
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "ADMIN COUNSELLING PROFILE ERROR:",
      profileError,
    );

    throw new Error(
      "Unable to verify admin access.",
    );
  }

  if (
    profile?.role !== "admin"
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
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  console.error(
    label,
    error,
  );

  return NextResponse.json(
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
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "counselling_bookings",
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (error) {
      console.error(
        "ADMIN COUNSELLING BOOKINGS GET ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load counselling bookings.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      bookings: data || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN COUNSELLING BOOKINGS GET ERROR:",
    );
  }
}

export async function PATCH(
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

    const id =
      getString(body.id);

    const status =
      getString(
        body.status,
      ).toLowerCase();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Counselling booking ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !ALLOWED_ADMIN_STATUSES.has(
        status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Admin booking status must be completed or cancelled. Payment approval must be handled through Admin Payments.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: existingBooking,
      error: lookupError,
    } =
      await supabaseAdmin
        .from(
          "counselling_bookings",
        )
        .select(
          "id,payment_status",
        )
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "ADMIN COUNSELLING BOOKING LOOKUP ERROR:",
        lookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load counselling booking.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingBooking) {
      return NextResponse.json(
        {
          error:
            "Counselling booking was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      existingBooking.payment_status ===
      status
    ) {
      return NextResponse.json({
        success: true,
        alreadyUpdated: true,
        booking:
          existingBooking,
      });
    }

    const {
      data: booking,
      error: updateError,
    } =
      await supabaseAdmin
        .from(
          "counselling_bookings",
        )
        .update({
          payment_status:
            status,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (updateError) {
      console.error(
        "ADMIN COUNSELLING BOOKING UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update counselling booking.",
        },
        {
          status: 500,
        },
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error:
            "Counselling booking was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      alreadyUpdated: false,
      booking,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN COUNSELLING BOOKING UPDATE ERROR:",
    );
  }
}
