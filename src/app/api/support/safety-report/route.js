// src/app/api/support/safety-report/route.js

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set([
  "Harassment or bullying",
  "Threats or intimidation",
  "Inappropriate messages",
  "Fake or misleading profile",
  "Scam or financial request",
  "Sexual or explicit content",
  "Discrimination or hate",
  "Safety concern after meeting",
  "Other",
]);

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

function cleanOptionalString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function buildReportMessage({
  category,
  reportedMember,
  subject,
  details,
  userId,
}) {
  const lines = [
    "SAFETY REPORT",
    "",
    `Category: ${category}`,
    `Reported member: ${reportedMember || "Not provided"}`,
    `Subject: ${subject || "Not provided"}`,
    `Reporter user ID: ${userId}`,
    "",
    "Report details:",
    details,
  ];

  return lines.join("\n");
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

    const category = cleanOptionalString(body?.category, 100);
    const subject = cleanOptionalString(body?.subject, 150);
    const reportedMember = cleanOptionalString(
      body?.reportedMember,
      150,
    );
    const details = cleanOptionalString(body?.details, 5000);

    if (!category || !VALID_CATEGORIES.has(category)) {
      return json(
        {
          success: false,
          error: "Please choose a valid safety report category.",
        },
        400,
      );
    }

    if (details.length < 20) {
      return json(
        {
          success: false,
          error:
            "Please provide at least 20 characters describing your concern.",
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

    let fullName =
      cleanOptionalString(user.user_metadata?.full_name, 200) ||
      cleanOptionalString(user.user_metadata?.name, 200);

    const email = cleanOptionalString(user.email, 320);

    if (!email) {
      return json(
        {
          success: false,
          error:
            "Your account does not have a valid email address.",
        },
        400,
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.warn("SAFETY REPORT PROFILE LOOKUP ERROR:", {
        userId: user.id,
        message: profileError.message,
      });
    }

    if (profile?.full_name?.trim()) {
      fullName = profile.full_name.trim().slice(0, 200);
    }

    if (!fullName) {
      fullName = "Delly's Matchups Member";
    }

    const contactSubject = subject
      ? `[SAFETY REPORT] ${subject}`
      : `[SAFETY REPORT] ${category}`;

    const message = buildReportMessage({
      category,
      reportedMember,
      subject,
      details,
      userId: user.id,
    });

    const { error: insertError } = await supabaseAdmin
      .from("contact_messages")
      .insert([
        {
          full_name: fullName,
          email,
          phone: cleanOptionalString(user.phone, 50),
          subject: contactSubject,
          message,
        },
      ]);

    if (insertError) {
      console.error("SAFETY REPORT INSERT ERROR:", {
        userId: user.id,
        message: insertError.message,
      });

      return json(
        {
          success: false,
          error:
            "Your safety report could not be submitted. Please try again.",
        },
        500,
      );
    }

    return json({
      success: true,
      message:
        "Your safety concern has been submitted securely for review.",
    });
  } catch (error) {
    console.error("SAFETY REPORT ERROR:", error);

    return json(
      {
        success: false,
        error:
          "Your safety report could not be submitted. Please try again later.",
      },
      500,
    );
  }
}
