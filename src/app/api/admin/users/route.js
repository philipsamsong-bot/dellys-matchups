// src/app/api/admin/users/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_MEMBERSHIPS = new Set([
  "free",
  "premium",
  "vip",
]);

const ALLOWED_ROLES = new Set([
  "user",
  "admin",
]);

const PROFILE_FIELDS = [
  "id",
  "full_name",
  "email",
  "country",
  "city",
  "role",
  "avatar_url",
  "membership_status",
  "membership_plan",
  "membership_started_at",
  "membership_expires_at",
  "plan",
  "subscription",
  "is_visible",
  "matchups_eligible",
  "created_at",
].join(",");

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

function isPaidMembership(value) {
  return (
    value === "premium" ||
    value === "vip"
  );
}

function getEffectiveMembership(profile) {
  if (
    isPaidMembership(
      profile.membership_status,
    )
  ) {
    return profile.membership_status;
  }

  if (
    isPaidMembership(
      profile.membership_plan,
    )
  ) {
    return profile.membership_plan;
  }

  if (
    isPaidMembership(
      profile.plan,
    )
  ) {
    return profile.plan;
  }

  if (
    isPaidMembership(
      profile.subscription,
    )
  ) {
    return profile.subscription;
  }

  return "free";
}

function addOneMonth(dateValue) {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Unable to calculate membership expiry.",
    );
  }

  const result =
    new Date(date);

  result.setMonth(
    result.getMonth() + 1,
  );

  return result.toISOString();
}

function getMembershipAnchorDate(profile) {
  const now =
    new Date();

  if (
    profile.membership_expires_at
  ) {
    const expiry =
      new Date(
        profile.membership_expires_at,
      );

    if (
      !Number.isNaN(
        expiry.getTime(),
      ) &&
      expiry > now
    ) {
      return expiry.toISOString();
    }
  }

  return now.toISOString();
}

function buildMembershipUpdate(
  membership,
  profile,
) {
  if (
    membership === "free"
  ) {
    return {
      membership_status:
        "free",
      membership_plan:
        "free",
      membership_started_at:
        null,
      membership_expires_at:
        null,
      plan:
        "free",
      subscription:
        "free",
    };
  }

  const now =
    new Date().toISOString();

  const currentMembership =
    getEffectiveMembership(
      profile,
    );

  const alreadyPaid =
    isPaidMembership(
      currentMembership,
    );

  const anchorDate =
    getMembershipAnchorDate(
      profile,
    );

  return {
    membership_status:
      membership,

    membership_plan:
      membership,

    membership_started_at:
      alreadyPaid
        ? profile.membership_started_at ||
          now
        : now,

    membership_expires_at:
      addOneMonth(
        anchorDate,
      ),

    plan:
      membership,

    subscription:
      membership,
  };
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
      "ADMIN USERS AUTH PROFILE ERROR:",
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

async function getProfile(
  supabaseAdmin,
  userId,
) {
  const {
    data: profile,
    error,
  } =
    await supabaseAdmin
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", userId)
      .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load user profile: ${error.message}`,
    );
  }

  return profile;
}

function buildProfileUpdate(
  body,
  existingProfile,
) {
  const updates = {};

  let hasUpdate = false;

  if (
    body.membership !==
    undefined
  ) {
    const membership =
      getString(
        body.membership,
      ).toLowerCase();

    if (
      !ALLOWED_MEMBERSHIPS.has(
        membership,
      )
    ) {
      return {
        error:
          "Membership must be free, premium, or vip.",
        updates: null,
      };
    }

    Object.assign(
      updates,
      buildMembershipUpdate(
        membership,
        existingProfile,
      ),
    );

    hasUpdate = true;
  }

  if (
    body.role !==
    undefined
  ) {
    const role =
      getString(
        body.role,
      ).toLowerCase();

    if (
      !ALLOWED_ROLES.has(
        role,
      )
    ) {
      return {
        error:
          "Role must be user or admin.",
        updates: null,
      };
    }

    updates.role =
      role;

    hasUpdate = true;
  }

  if (
    body.is_visible !==
    undefined
  ) {
    if (
      typeof body.is_visible !==
      "boolean"
    ) {
      return {
        error:
          "Visibility must be true or false.",
        updates: null,
      };
    }

    updates.is_visible =
      body.is_visible;

    hasUpdate = true;
  }

  if (
    body.matchups_eligible !==
    undefined
  ) {
    if (
      typeof body.matchups_eligible !==
      "boolean"
    ) {
      return {
        error:
          "Matchups eligibility must be true or false.",
        updates: null,
      };
    }

    updates.matchups_eligible =
      body.matchups_eligible;

    hasUpdate = true;
  }

  if (!hasUpdate) {
    return {
      error:
        "No supported user update was provided.",
      updates: null,
    };
  }

  return {
    error: null,
    updates,
  };
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
      data: users,
      error,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (error) {
      console.error(
        "ADMIN USERS GET ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load users.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      users:
        users || [],
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN USERS GET ERROR:",
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

    const userId =
      getString(
        body.id,
      );

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "User ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingProfile =
      await getProfile(
        supabaseAdmin,
        userId,
      );

    if (
      !existingProfile
    ) {
      return NextResponse.json(
        {
          error:
            "User profile was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      error:
        validationError,
      updates,
    } =
      buildProfileUpdate(
        body,
        existingProfile,
      );

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

    const {
      data: user,
      error: updateError,
    } =
      await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select(PROFILE_FIELDS)
        .maybeSingle();

    if (updateError) {
      console.error(
        "ADMIN USER UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update user.",
        },
        {
          status: 500,
        },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error:
            "User profile was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "ADMIN USER UPDATE ERROR:",
    );
  }
}
