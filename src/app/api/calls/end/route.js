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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

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

    const { data: existingCall, error: existingCallError } = await supabase
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
        { error: "You are not allowed to end this call." },
        { status: 403 }
      );
    }

    const { data: updatedCall, error: updateError } = await supabase
      .from("matchup_calls")
      .update({
        status: "ended",
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
      { error: error.message || "Unable to end call." },
      { status: 500 }
    );
  }
}
