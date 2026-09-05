// src/app/api/admin/gallery/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const FIELD_LIMITS = {
  title: 300,
  category: 150,
  imageUrl: 2000,
};

class AdminAuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function getRequiredEnvironmentVariable(value, name) {
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

function isValidImageUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
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
    getAuthorizationToken(request);

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
    await supabaseAdmin.auth.getUser(token);

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
      "ADMIN GALLERY PROFILE ERROR:",
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

function validateCreateInput({
  title,
  category,
  imageUrl,
  featured,
  published,
}) {
  if (!title) {
    return "Gallery image title is required.";
  }

  if (
    title.length >
    FIELD_LIMITS.title
  ) {
    return "Gallery image title is too long.";
  }

  if (
    category.length >
    FIELD_LIMITS.category
  ) {
    return "Gallery category is too long.";
  }

  if (!imageUrl) {
    return "Gallery image URL is required.";
  }

  if (
    imageUrl.length >
    FIELD_LIMITS.imageUrl
  ) {
    return "Gallery image URL is too long.";
  }

  if (
    !isValidImageUrl(
      imageUrl,
    )
  ) {
    return "Gallery image must use a valid HTTPS URL.";
  }

  if (
    typeof featured !==
    "boolean"
  ) {
    return "Featured must be true or false.";
  }

  if (
    typeof published !==
    "boolean"
  ) {
    return "Published must be true or false.";
  }

  return null;
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

export async function GET(request) {
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
        .from("gallery_images")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (error) {
      console.error(
        "ADMIN GALLERY GET ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load gallery images.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      images: data || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN GALLERY GET ERROR:",
    );
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin =
      createSupabaseAdmin();

    await requireAdmin(
      request,
      supabaseAdmin,
    );

    const body =
      await request.json();

    const title =
      getString(body.title);

    const category =
      getString(
        body.category,
      ) || "General";

    const imageUrl =
      getString(
        body.image_url,
      );

    const featured =
      body.featured;

    const published =
      body.published;

    const validationError =
      validateCreateInput({
        title,
        category,
        imageUrl,
        featured,
        published,
      });

    if (validationError) {
      return NextResponse.json(
        {
          error:
            validationError,
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: image,
      error,
    } =
      await supabaseAdmin
        .from("gallery_images")
        .insert({
          title,
          category,
          image_url:
            imageUrl,
          featured,
          published,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "ADMIN GALLERY CREATE ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create gallery image.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        image,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN GALLERY CREATE ERROR:",
    );
  }
}

export async function PATCH(request) {
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

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Gallery image ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const updates = {};

    if (
      body.published !==
      undefined
    ) {
      if (
        typeof body.published !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "Published must be true or false.",
          },
          {
            status: 400,
          },
        );
      }

      updates.published =
        body.published;
    }

    if (
      body.featured !==
      undefined
    ) {
      if (
        typeof body.featured !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "Featured must be true or false.",
          },
          {
            status: 400,
          },
        );
      }

      updates.featured =
        body.featured;
    }

    if (
      Object.keys(updates)
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Published or featured status is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: existingImage,
      error: lookupError,
    } =
      await supabaseAdmin
        .from("gallery_images")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "ADMIN GALLERY LOOKUP ERROR:",
        lookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load gallery image.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingImage) {
      return NextResponse.json(
        {
          error:
            "Gallery image was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      data: image,
      error: updateError,
    } =
      await supabaseAdmin
        .from("gallery_images")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (updateError) {
      console.error(
        "ADMIN GALLERY UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update gallery image.",
        },
        {
          status: 500,
        },
      );
    }

    if (!image) {
      return NextResponse.json(
        {
          error:
            "Gallery image was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN GALLERY UPDATE ERROR:",
    );
  }
}

export async function DELETE(request) {
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
      new URL(request.url);

    const id =
      getString(
        searchParams.get("id"),
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Gallery image ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: deletedImage,
      error,
    } =
      await supabaseAdmin
        .from("gallery_images")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error) {
      console.error(
        "ADMIN GALLERY DELETE ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete gallery image.",
        },
        {
          status: 500,
        },
      );
    }

    if (!deletedImage) {
      return NextResponse.json(
        {
          error:
            "Gallery image was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      id:
        deletedImage.id,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN GALLERY DELETE ERROR:",
    );
  }
}
