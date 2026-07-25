import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

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

    const body = await request.json();
    const callId = body?.callId;

    if (!callId) {
      return NextResponse.json(
        { error: "callId is required." },
        { status: 400 }
      );
    }

    const { data: existingCall, error: existingCallError } = await adminClient
      .from("matchup_calls")
      .select("*")
      .eq("id", callId)
      .single();

    if (existingCallError || !existingCall) {
      return NextResponse.json(
        { error: "Call not found." },
        { status: 404 }
      );
    }

    const isParticipant =
      existingCall.caller_id === user.id || existingCall.receiver_id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not allowed to mark this call as missed." },
        { status: 403 }
      );
    }

    if (existingCall.status !== "initiated") {
      return NextResponse.json(
        { error: "Only initiated calls can be marked as missed." },
        { status: 400 }
      );
    }

    const { data: updatedCall, error: updateError } = await adminClient
      .from("matchup_calls")
      .update({
        status: "missed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", callId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      call: updatedCall,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to mark call as missed." },
      { status: 500 }
    );
  }
}
