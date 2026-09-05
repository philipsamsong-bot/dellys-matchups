// src/app/api/admin/contact-messages/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      "ADMIN CONTACT MESSAGES PROFILE ERROR:",
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
    return NextResponse.json(
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
          "contact_messages",
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
        "ADMIN CONTACT MESSAGES GET ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load contact messages.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      messages:
        data || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN CONTACT MESSAGES GET ERROR:",
    );
  }
}

export async function DELETE(
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

    const id =
      getString(
        searchParams.get(
          "id",
        ),
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Contact message ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: deletedMessage,
      error,
    } =
      await supabaseAdmin
        .from(
          "contact_messages",
        )
        .delete()
        .eq(
          "id",
          id,
        )
        .select("id")
        .maybeSingle();

    if (error) {
      console.error(
        "ADMIN CONTACT MESSAGE DELETE ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete contact message.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !deletedMessage
    ) {
      return NextResponse.json(
        {
          error:
            "Contact message was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      id:
        deletedMessage.id,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN CONTACT MESSAGE DELETE ERROR:",
    );
  }
}
