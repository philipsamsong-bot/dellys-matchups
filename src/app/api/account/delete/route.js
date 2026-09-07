// src/app/api/account/delete/route.js

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELETE_CONFIRMATION = "DELETE MY ACCOUNT";
const PROFILE_PHOTOS_BUCKET = "profile-photos";

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
}

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is incomplete.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function removeStorageFolder(supabaseAdmin, folder) {
  const {
    data: files,
    error: listError,
  } = await supabaseAdmin.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .list(folder, {
      limit: 1000,
    });

  if (listError) {
    console.warn("ACCOUNT DELETE STORAGE LIST ERROR:", {
      folder,
      message: listError.message,
    });
    return;
  }

  if (!files?.length) {
    return;
  }

  const paths = files
    .filter((file) => file?.name)
    .map((file) => `${folder}/${file.name}`);

  if (!paths.length) {
    return;
  }

  const { error: removeError } = await supabaseAdmin.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .remove(paths);

  if (removeError) {
    console.warn("ACCOUNT DELETE STORAGE REMOVE ERROR:", {
      folder,
      message: removeError.message,
    });
  }
}

async function removeProfileStorage(supabaseAdmin, userId) {
  await Promise.all([
    removeStorageFolder(
      supabaseAdmin,
      `${userId}/avatar`,
    ),
    removeStorageFolder(
      supabaseAdmin,
      `${userId}/gallery`,
    ),
  ]);
}

export async function POST(request) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return json(
        {
          success: false,
          error: "Authentication is required.",
        },
        401,
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json(
        {
          success: false,
          error: "Invalid request body.",
        },
        400,
      );
    }

    if (body?.confirmation !== DELETE_CONFIRMATION) {
      return json(
        {
          success: false,
          error:
            'Account deletion requires the confirmation "DELETE MY ACCOUNT".',
        },
        400,
      );
    }

    const supabaseAdmin = createSupabaseAdmin();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return json(
        {
          success: false,
          error:
            "Your session is invalid or has expired. Please sign in again.",
        },
        401,
      );
    }

    await removeProfileStorage(
      supabaseAdmin,
      user.id,
    );

    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("ACCOUNT DELETE AUTH ERROR:", {
        userId: user.id,
        message: deleteError.message,
      });

      return json(
        {
          success: false,
          error:
            "We could not delete your account. Please contact support if the problem continues.",
        },
        500,
      );
    }

    return json({
      success: true,
      message: "Your Delly's Matchups account has been deleted.",
    });
  } catch (error) {
    console.error("ACCOUNT DELETE ERROR:", error);

    return json(
      {
        success: false,
        error:
          "We could not delete your account. Please try again later.",
      },
      500,
    );
  }
}
