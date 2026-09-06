// src/app/api/calls/end/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamClient } from "@stream-io/node-sdk";

export const runtime = "nodejs";

const STREAM_END_TIMEOUT_MS = 5000;

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

function createTimeoutPromise(timeoutMs) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(
        new Error(
          `Stream call end timed out after ${timeoutMs}ms.`,
        ),
      );
    }, timeoutMs);
  });
}

async function endStreamCall(streamCallId) {
  if (!streamCallId) {
    return {
      attempted: false,
      ended: false,
    };
  }

  try {
    const streamClient = createStreamClient();
    const streamCall = streamClient.video.call(
      "default",
      streamCallId,
    );

    await Promise.race([
      streamCall.end(),
      createTimeoutPromise(STREAM_END_TIMEOUT_MS),
    ]);

    return {
      attempted: true,
      ended: true,
    };
  } catch (error) {
    console.error(
      "STREAM END CALL ERROR:",
      error,
    );

    return {
      attempted: true,
      ended: false,
    };
  }
}

async function loadCall(supabaseAdmin, callId) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("matchup_calls")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  return {
    call: data,
    error,
  };
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
      call: existingCall,
      error: existingCallError,
    } = await loadCall(
      supabaseAdmin,
      callId,
    );

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

    if (
      !isParticipant(
        existingCall,
        user.id,
      )
    ) {
      return NextResponse.json(
        {
          error: "You are not allowed to end this call.",
        },
        {
          status: 403,
        },
      );
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

    if (existingCall.status === "ended") {
      const streamResult =
        await endStreamCall(
          existingCall.stream_call_id,
        );

      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        streamEnded: streamResult.ended,
        call: existingCall,
      });
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

    const endedAt =
      new Date().toISOString();

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

    let authoritativeCall =
      updatedCall;

    let alreadyEnded = false;

    if (!authoritativeCall) {
      const {
        call: latestCall,
        error: latestCallError,
      } = await loadCall(
        supabaseAdmin,
        callId,
      );

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
        !latestCall ||
        !isParticipant(
          latestCall,
          user.id,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "The call changed state before it could be ended.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        latestCall.status !== "ended"
      ) {
        return NextResponse.json(
          {
            error:
              "The call changed state before it could be ended.",
          },
          {
            status: 409,
          },
        );
      }

      authoritativeCall =
        latestCall;
      alreadyEnded = true;
    }

    const streamResult =
      await endStreamCall(
        authoritativeCall.stream_call_id,
      );

    return NextResponse.json({
      success: true,
      alreadyEnded,
      streamEnded:
        streamResult.ended,
      call: authoritativeCall,
    });
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
