// src/app/api/calls/end/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamClient } from "@stream-io/node-sdk";

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

function createStreamClient() {
  return new StreamClient(
    getRequiredEnvironmentVariable("STREAM_API_KEY"),
    getRequiredEnvironmentVariable("STREAM_API_SECRET"),
  );
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function isParticipant(call, userId) {
  return (
    call.caller_id === userId ||
    call.receiver_id === userId
  );
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
        "CALL END LOOKUP ERROR:",
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

    if (!isParticipant(existingCall, user.id)) {
      return NextResponse.json(
        {
          error: "You are not allowed to end this call.",
        },
        {
          status: 403,
        },
      );
    }

    if (existingCall.status === "ended") {
      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        call: existingCall,
      });
    }

    if (
      existingCall.status === "rejected" ||
      existingCall.status === "missed"
    ) {
      return NextResponse.json(
        {
          error: `This call has already been ${existingCall.status}.`,
        },
        {
          status: 409,
        },
      );
    }

    if (
      existingCall.status !== "initiated" &&
      existingCall.status !== "accepted"
    ) {
      return NextResponse.json(
        {
          error: "This call cannot be ended.",
        },
        {
          status: 409,
        },
      );
    }

    if (existingCall.stream_call_id) {
      try {
        const streamClient = createStreamClient();

        const streamCall = streamClient.video.call(
          "default",
          existingCall.stream_call_id,
        );

        await streamCall.end();
      } catch (streamError) {
        console.error(
          "STREAM END CALL ERROR:",
          streamError,
        );

        return NextResponse.json(
          {
            error: "Unable to end the live call.",
          },
          {
            status: 502,
          },
        );
      }
    }

    const endedAt = new Date().toISOString();

    const {
      data: updatedCall,
      error: updateError,
    } = await supabaseAdmin
      .from("matchup_calls")
      .update({
        status: "ended",
        ended_at: endedAt,
      })
      .eq("id", callId)
      .in("status", [
        "initiated",
        "accepted",
      ])
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error(
        "CALL END UPDATE ERROR:",
        updateError,
      );

      return NextResponse.json(
        {
          error: "Unable to update call status.",
        },
        {
          status: 500,
        },
      );
    }

    if (updatedCall) {
      return NextResponse.json({
        success: true,
        alreadyEnded: false,
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
        "CALL END RELOAD ERROR:",
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
      latestCall.status === "ended" &&
      isParticipant(latestCall, user.id)
    ) {
      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        call: latestCall,
      });
    }

    return NextResponse.json(
      {
        error:
          "The call changed state before it could be ended.",
      },
      {
        status: 409,
      },
    );
  } catch (error) {
    console.error(
      "CALL END ROUTE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to end call.",
      },
      {
        status: 500,
      },
    );
  }
}
