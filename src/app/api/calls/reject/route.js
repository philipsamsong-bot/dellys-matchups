// src/app/api/calls/reject/route.js

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function createSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return {
    authClient: createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
    adminClient: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

function isTerminalStatus(status) {
  return ["rejected", "missed", "ended"].includes(status);
}

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const { authClient, adminClient } = createSupabaseClients();

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized user." },
        { status: 401 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const callId =
      typeof body?.callId === "string" ? body.callId.trim() : "";

    if (!callId) {
      return NextResponse.json(
        { error: "callId is required." },
        { status: 400 }
      );
    }

    const { data: existingCall, error: existingCallError } =
      await adminClient
        .from("matchup_calls")
        .select("*")
        .eq("id", callId)
        .maybeSingle();

    if (existingCallError) {
      return NextResponse.json(
        { error: existingCallError.message },
        { status: 500 }
      );
    }

    if (!existingCall) {
      return NextResponse.json(
        { error: "Call not found." },
        { status: 404 }
      );
    }

    if (existingCall.receiver_id !== user.id) {
      return NextResponse.json(
        {
          error: "Only the receiving participant can reject this call.",
        },
        { status: 403 }
      );
    }

    if (existingCall.status === "rejected") {
      return NextResponse.json({
        success: true,
        call: existingCall,
      });
    }

    if (isTerminalStatus(existingCall.status)) {
      return NextResponse.json(
        {
          error: `This call has already been ${existingCall.status}.`,
        },
        { status: 409 }
      );
    }

    if (existingCall.status !== "initiated") {
      return NextResponse.json(
        { error: "This call can no longer be rejected." },
        { status: 409 }
      );
    }

    const endedAt = new Date().toISOString();

    const { data: updatedCall, error: updateError } =
      await adminClient
        .from("matchup_calls")
        .update({
          status: "rejected",
          ended_at: endedAt,
        })
        .eq("id", callId)
        .eq("status", "initiated")
        .select("*")
        .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (updatedCall) {
      return NextResponse.json({
        success: true,
        call: updatedCall,
      });
    }

    const { data: latestCall, error: latestCallError } =
      await adminClient
        .from("matchup_calls")
        .select("*")
        .eq("id", callId)
        .maybeSingle();

    if (latestCallError) {
      return NextResponse.json(
        { error: latestCallError.message },
        { status: 500 }
      );
    }

    if (
      latestCall &&
      latestCall.receiver_id === user.id &&
      latestCall.status === "rejected"
    ) {
      return NextResponse.json({
        success: true,
        call: latestCall,
      });
    }

    return NextResponse.json(
      {
        error: "The call changed state before it could be rejected.",
      },
      { status: 409 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reject call.",
      },
      { status: 500 }
    );
  }
}
