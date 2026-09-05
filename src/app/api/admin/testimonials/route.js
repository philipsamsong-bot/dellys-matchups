// src/app/api/admin/testimonials/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

class AdminAuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function getRequiredEnvironmentVariable(value, name) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
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

function getAuthorizationToken(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdmin(request, supabaseAdmin) {
  const token = getAuthorizationToken(request);

  if (!token) {
    throw new AdminAuthError("Not authenticated.", 401);
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    throw new AdminAuthError("Invalid session.", 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "ADMIN TESTIMONIALS AUTH PROFILE ERROR:",
      profileError,
    );

    throw new Error("Unable to verify admin access.");
  }

  if (profile?.role !== "admin") {
    throw new AdminAuthError("Admin access required.", 403);
  }

  return user;
}

function handleRouteError(error, label) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  console.error(label, error);

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

export async function GET(request) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    await requireAdmin(request, supabaseAdmin);

    const { data: testimonials, error } = await supabaseAdmin
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ADMIN TESTIMONIALS GET ERROR:", error);

      return NextResponse.json(
        {
          error: "Unable to load testimonials.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      testimonials: testimonials || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN TESTIMONIALS GET ERROR:",
    );
  }
}

export async function PATCH(request) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    await requireAdmin(request, supabaseAdmin);

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

    const id = getString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          error: "Testimonial ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof body.approved !== "boolean") {
      return NextResponse.json(
        {
          error: "Approved must be true or false.",
        },
        {
          status: 400,
        },
      );
    }

    const { data: existingTestimonial, error: lookupError } =
      await supabaseAdmin
        .from("testimonials")
        .select("id, approved")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "ADMIN TESTIMONIAL LOOKUP ERROR:",
        lookupError,
      );

      return NextResponse.json(
        {
          error: "Unable to load testimonial.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingTestimonial) {
      return NextResponse.json(
        {
          error: "Testimonial not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existingTestimonial.approved === body.approved) {
      const { data: testimonial, error: reloadError } =
        await supabaseAdmin
          .from("testimonials")
          .select("*")
          .eq("id", id)
          .maybeSingle();

      if (reloadError) {
        console.error(
          "ADMIN TESTIMONIAL RELOAD ERROR:",
          reloadError,
        );

        return NextResponse.json(
          {
            error: "Unable to reload testimonial.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json({
        success: true,
        alreadyUpdated: true,
        testimonial,
      });
    }

    const { data: testimonial, error: updateError } =
      await supabaseAdmin
        .from("testimonials")
        .update({
          approved: body.approved,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (updateError) {
      console.error(
        "ADMIN TESTIMONIAL UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error: "Unable to update testimonial.",
        },
        {
          status: 500,
        },
      );
    }

    if (!testimonial) {
      return NextResponse.json(
        {
          error: "Testimonial not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      alreadyUpdated: false,
      testimonial,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN TESTIMONIALS PATCH ERROR:",
    );
  }
}

export async function DELETE(request) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    await requireAdmin(request, supabaseAdmin);

    const url = new URL(request.url);
    const id = getString(url.searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        {
          error: "Testimonial ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const { data: existingTestimonial, error: lookupError } =
      await supabaseAdmin
        .from("testimonials")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "ADMIN TESTIMONIAL DELETE LOOKUP ERROR:",
        lookupError,
      );

      return NextResponse.json(
        {
          error: "Unable to load testimonial.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingTestimonial) {
      return NextResponse.json(
        {
          error: "Testimonial not found.",
        },
        {
          status: 404,
        },
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "ADMIN TESTIMONIAL DELETE ERROR:",
        deleteError,
      );

      return NextResponse.json(
        {
          error: "Unable to delete testimonial.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN TESTIMONIALS DELETE ERROR:",
    );
  }
}
