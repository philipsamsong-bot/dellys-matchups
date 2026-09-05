// src/app/api/calls/accept/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const TERMINAL_STATUSES = new Set([
  "rejected",
  "missed",
  "ended",
]);

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAdmin() {
  return createClient(
    getRequiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

export async function POST(request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Missing authorization token.",
        },
        {
          status: 401,
        },
      );
    }

    const supabaseAdmin = createSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized user.",
        },
        {
          status: 401,
        },
      );
    }

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

    const callId =
      typeof body?.callId === "string"
        ? body.callId.trim()
        : "";

    if (!callId) {
      return NextResponse.json(
        {
          error: "callId is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: existingCall,
      error: existingCallError,
    } = await supabaseAdmin
      .from("matchup_calls")
      .select("*")
      .eq("id", callId)
      .maybeSingle();

    if (existingCallError) {
      console.error(
        "CALL ACCEPT LOOKUP ERROR:",
        existingCallError,
      );

      return NextResponse.json(
        {
          error: "Unable to load call.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingCall) {
      return NextResponse.json(
        {
          error: "Call not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existingCall.receiver_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the receiving participant can accept this call.",
        },
        {
          status: 403,
        },
      );
    }

    if (existingCall.status === "accepted") {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        call: existingCall,
      });
    }

    if (TERMINAL_STATUSES.has(existingCall.status)) {
      return NextResponse.json(
        {
          error: `This call has already been ${existingCall.status}.`,
        },
        {
          status: 409,
        },
      );
    }

    if (existingCall.status !== "initiated") {
      return NextResponse.json(
        {
          error: "This call cannot be accepted.",
        },
        {
          status: 409,
        },
      );
    }

    const startedAt = new Date().toISOString();

    const {
      data: updatedCall,
      error: updateError,
    } = await supabaseAdmin
      .from("matchup_calls")
      .update({
        status: "accepted",
        started_at: startedAt,
      })
      .eq("id", callId)
      .eq("status", "initiated")
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error(
        "CALL ACCEPT UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error: "Unable to accept call.",
        },
        {
          status: 500,
        },
      );
    }

    if (updatedCall) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: false,
        call: updatedCall,
      });
    }

    const {
      data: latestCall,
      error: latestCallError,
    } = await supabaseAdmin
      .from("matchup_calls")
      .select("*")
      .eq("id", callId)
      .maybeSingle();

    if (latestCallError) {
      console.error(
        "CALL ACCEPT RELOAD ERROR:",
        latestCallError,
      );

      return NextResponse.json(
        {
          error: "Unable to reload call status.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      latestCall &&
      latestCall.receiver_id === user.id &&
      latestCall.status === "accepted"
    ) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        call: latestCall,
      });
    }

    return NextResponse.json(
      {
        error:
          "The call changed state before it could be accepted.",
      },
      {
        status: 409,
      },
    );
  } catch (error) {
    console.error(
      "CALL ACCEPT ROUTE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to accept call.",
      },
      {
        status: 500,
      },
    );
  }
}
