// src/app/api/calls/miss/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
        "CALL MISS LOOKUP ERROR:",
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

    if (existingCall.caller_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the caller can mark this call as missed.",
        },
        {
          status: 403,
        },
      );
    }

    if (existingCall.status === "missed") {
      return NextResponse.json({
        success: true,
        alreadyMissed: true,
        call: existingCall,
      });
    }

    if (existingCall.status !== "initiated") {
      return NextResponse.json(
        {
          error:
            `This call is already ${existingCall.status} and cannot be marked as missed.`,
        },
        {
          status: 409,
        },
      );
    }

    const endedAt = new Date().toISOString();

    const {
      data: updatedCall,
      error: updateError,
    } = await supabaseAdmin
      .from("matchup_calls")
      .update({
        status: "missed",
        ended_at: endedAt,
      })
      .eq("id", callId)
      .eq("status", "initiated")
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error(
        "CALL MISS UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error: "Unable to mark call as missed.",
        },
        {
          status: 500,
        },
      );
    }

    if (updatedCall) {
      return NextResponse.json({
        success: true,
        alreadyMissed: false,
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
        "CALL MISS RELOAD ERROR:",
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
      latestCall.caller_id === user.id &&
      latestCall.status === "missed"
    ) {
      return NextResponse.json({
        success: true,
        alreadyMissed: true,
        call: latestCall,
      });
    }

    return NextResponse.json(
      {
        error:
          "The call changed state before it could be marked as missed.",
      },
      {
        status: 409,
      },
    );
  } catch (error) {
    console.error(
      "CALL MISS ROUTE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to mark call as missed.",
      },
      {
        status: 500,
      },
    );
  }
}
