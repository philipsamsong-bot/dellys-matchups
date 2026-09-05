// src/app/api/admin/articles/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const FIELD_LIMITS = {
  title: 300,
  slug: 300,
  author: 200,
  featuredImage: 2000,
};

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

function makeSlug(value) {
  return getString(value)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidImageUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
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
      "ADMIN ARTICLES PROFILE ERROR:",
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

function validateArticleInput({
  title,
  slug,
  author,
  featuredImage,
  content,
}) {
  if (!title) {
    return "Article title is required.";
  }

  if (
    title.length >
    FIELD_LIMITS.title
  ) {
    return "Article title is too long.";
  }

  if (!slug) {
    return "Article slug is required.";
  }

  if (
    slug.length >
    FIELD_LIMITS.slug
  ) {
    return "Article slug is too long.";
  }

  if (
    slug !==
    makeSlug(slug)
  ) {
    return "Article slug contains invalid characters.";
  }

  if (!author) {
    return "Article author is required.";
  }

  if (
    author.length >
    FIELD_LIMITS.author
  ) {
    return "Article author is too long.";
  }

  if (
    featuredImage.length >
    FIELD_LIMITS.featuredImage
  ) {
    return "Featured image URL is too long.";
  }

  if (
    !isValidImageUrl(
      featuredImage,
    )
  ) {
    return "Featured image must use a valid HTTPS URL.";
  }

  if (!content) {
    return "Article content is required.";
  }

  return null;
}

async function findArticleBySlug(
  supabaseAdmin,
  slug,
  excludeId = "",
) {
  let query =
    supabaseAdmin
      .from("articles")
      .select("id,slug")
      .eq(
        "slug",
        slug,
      )
      .limit(2);

  if (excludeId) {
    query =
      query.neq(
        "id",
        excludeId,
      );
  }

  const {
    data,
    error,
  } =
    await query;

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return Array.isArray(data)
    ? data
    : [];
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
        .from("articles")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (error) {
      console.error(
        "ADMIN ARTICLES GET ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load articles.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      articles:
        data || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN ARTICLES GET ERROR:",
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

    const title =
      getString(
        body.title,
      );

    const slug =
      makeSlug(
        body.slug ||
          title,
      );

    const author =
      getString(
        body.author,
      ) ||
      "Delly Singah";

    const featuredImage =
      getString(
        body.featured_image,
      );

    const content =
      getString(
        body.content,
      );

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

    const validationError =
      validateArticleInput({
        title,
        slug,
        author,
        featuredImage,
        content,
      });

    if (
      validationError
    ) {
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

    const duplicates =
      await findArticleBySlug(
        supabaseAdmin,
        slug,
      );

    if (
      duplicates.length >
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Another article already uses this slug.",
        },
        {
          status: 409,
        },
      );
    }

    const now =
      new Date().toISOString();

    const {
      data: article,
      error,
    } =
      await supabaseAdmin
        .from("articles")
        .insert({
          title,
          slug,
          author,
          featured_image:
            featuredImage,
          content,
          published:
            body.published,
          updated_at:
            now,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "ADMIN ARTICLE CREATE ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create article.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        article,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN ARTICLE CREATE ERROR:",
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
      getString(
        body.id,
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Article ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: existingArticle,
      error:
        articleLookupError,
    } =
      await supabaseAdmin
        .from("articles")
        .select("*")
        .eq(
          "id",
          id,
        )
        .maybeSingle();

    if (
      articleLookupError
    ) {
      console.error(
        "ADMIN ARTICLE LOOKUP ERROR:",
        articleLookupError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load article.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !existingArticle
    ) {
      return NextResponse.json(
        {
          error:
            "Article was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const hasFullArticlePayload =
      body.title !== undefined ||
      body.slug !== undefined ||
      body.author !== undefined ||
      body.featured_image !==
        undefined ||
      body.content !== undefined;

    if (
      !hasFullArticlePayload
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

      const {
        data: article,
        error,
      } =
        await supabaseAdmin
          .from("articles")
          .update({
            published:
              body.published,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            id,
          )
          .select("*")
          .maybeSingle();

      if (error) {
        console.error(
          "ADMIN ARTICLE PUBLISH ERROR:",
          error,
        );

        return NextResponse.json(
          {
            error:
              "Unable to update article publication status.",
          },
          {
            status: 500,
          },
        );
      }

      if (!article) {
        return NextResponse.json(
          {
            error:
              "Article was not found.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        success: true,
        article,
      });
    }

    const title =
      getString(
        body.title,
      );

    const slug =
      makeSlug(
        body.slug ||
          title,
      );

    const author =
      getString(
        body.author,
      ) ||
      "Delly Singah";

    const featuredImage =
      getString(
        body.featured_image,
      );

    const content =
      getString(
        body.content,
      );

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

    const validationError =
      validateArticleInput({
        title,
        slug,
        author,
        featuredImage,
        content,
      });

    if (
      validationError
    ) {
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

    const duplicates =
      await findArticleBySlug(
        supabaseAdmin,
        slug,
        id,
      );

    if (
      duplicates.length >
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Another article already uses this slug.",
        },
        {
          status: 409,
        },
      );
    }

    const {
      data: article,
      error,
    } =
      await supabaseAdmin
        .from("articles")
        .update({
          title,
          slug,
          author,
          featured_image:
            featuredImage,
          content,
          published:
            body.published,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          id,
        )
        .select("*")
        .maybeSingle();

    if (error) {
      console.error(
        "ADMIN ARTICLE UPDATE ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update article.",
        },
        {
          status: 500,
        },
      );
    }

    if (!article) {
      return NextResponse.json(
        {
          error:
            "Article was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN ARTICLE UPDATE ERROR:",
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
            "Article ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: article,
      error,
    } =
      await supabaseAdmin
        .from("articles")
        .delete()
        .eq(
          "id",
          id,
        )
        .select("id")
        .maybeSingle();

    if (error) {
      console.error(
        "ADMIN ARTICLE DELETE ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete article.",
        },
        {
          status: 500,
        },
      );
    }

    if (!article) {
      return NextResponse.json(
        {
          error:
            "Article was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      id:
        article.id,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN ARTICLE DELETE ERROR:",
    );
  }
}
