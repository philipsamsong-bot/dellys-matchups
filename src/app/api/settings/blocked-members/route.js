// src/app/api/settings/blocked-members/route.js

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function authenticateRequest(request, supabaseAdmin) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      user: null,
      response: json(
        {
          success: false,
          error: "Authentication is required.",
        },
        401,
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return {
      user: null,
      response: json(
        {
          success: false,
          error:
            "Your session is invalid or has expired. Please sign in again.",
        },
        401,
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    const { user, response } = await authenticateRequest(
      request,
      supabaseAdmin,
    );

    if (response || !user) {
      return response;
    }

    const { data: blockRows, error: blockError } =
      await supabaseAdmin
        .from("member_blocks")
        .select("blocked_id, created_at")
        .eq("blocker_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (blockError) {
      console.error("BLOCKED MEMBERS LIST ERROR:", {
        userId: user.id,
        message: blockError.message,
      });

      return json(
        {
          success: false,
          error: "We could not load your blocked members.",
        },
        500,
      );
    }

    if (!blockRows?.length) {
      return json({
        success: true,
        members: [],
      });
    }

    const blockedIds = blockRows.map((row) => row.blocked_id);

    const { data: profiles, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", blockedIds);

    if (profileError) {
      console.error("BLOCKED MEMBERS PROFILE ERROR:", {
        userId: user.id,
        message: profileError.message,
      });

      return json(
        {
          success: false,
          error: "We could not load your blocked members.",
        },
        500,
      );
    }

    const profilesById = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        profile,
      ]),
    );

    const members = blockRows.map((row) => {
      const profile = profilesById.get(row.blocked_id);

      return {
        id: row.blocked_id,
        fullName:
          profile?.full_name?.trim() || "Matchups Member",
        avatarUrl: profile?.avatar_url || null,
        blockedAt: row.created_at || null,
      };
    });

    return json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("BLOCKED MEMBERS GET ERROR:", error);

    return json(
      {
        success: false,
        error:
          "We could not load your blocked members. Please try again later.",
      },
      500,
    );
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    const { user, response } = await authenticateRequest(
      request,
      supabaseAdmin,
    );

    if (response || !user) {
      return response;
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

    const action =
      typeof body?.action === "string"
        ? body.action.trim().toLowerCase()
        : "";

    const memberId =
      typeof body?.memberId === "string"
        ? body.memberId.trim()
        : "";

    if (action !== "unblock") {
      return json(
        {
          success: false,
          error: "Unsupported blocked-members action.",
        },
        400,
      );
    }

    if (!memberId || !isUuid(memberId)) {
      return json(
        {
          success: false,
          error: "A valid member ID is required.",
        },
        400,
      );
    }

    const { data: existingBlock, error: lookupError } =
      await supabaseAdmin
        .from("member_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", memberId)
        .maybeSingle();

    if (lookupError) {
      console.error("BLOCKED MEMBER LOOKUP ERROR:", {
        userId: user.id,
        memberId,
        message: lookupError.message,
      });

      return json(
        {
          success: false,
          error: "We could not update your blocked list.",
        },
        500,
      );
    }

    if (!existingBlock) {
      return json({
        success: true,
        message: "This member is already unblocked.",
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("member_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", memberId);

    if (deleteError) {
      console.error("BLOCKED MEMBER DELETE ERROR:", {
        userId: user.id,
        memberId,
        message: deleteError.message,
      });

      return json(
        {
          success: false,
          error: "This member could not be unblocked.",
        },
        500,
      );
    }

    return json({
      success: true,
      message: "The member has been unblocked.",
    });
  } catch (error) {
    console.error("BLOCKED MEMBERS POST ERROR:", error);

    return json(
      {
        success: false,
        error:
          "We could not update your blocked list. Please try again later.",
      },
      500,
    );
  }
}