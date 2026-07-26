// app/api/calls/start/route.js

import { StreamClient } from "@stream-io/node-sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getMembership(profile) {
  return (
    profile?.membership_status ||
    profile?.membership_plan ||
    profile?.plan ||
    profile?.subscription ||
    "free"
  )
    .trim()
    .toLowerCase();
}

function canSendMessages(profile) {
  const membership = getMembership(profile);

  return membership === "premium" || membership === "vip";
}

function canStartAudioCall(profile) {
  const membership = getMembership(profile);

  return membership === "premium" || membership === "vip";
}

function canStartVideoCall(profile) {
  const membership = getMembership(profile);

  return membership === "premium" || membership === "vip";
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown error.";
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const streamApiKey = process.env.STREAM_API_KEY;
    const streamApiSecret = process.env.STREAM_API_SECRET;

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey ||
      !streamApiKey ||
      !streamApiSecret
    ) {
      return NextResponse.json(
        {
          error: "Server environment variables are missing.",
          details: {
            hasSupabaseUrl: Boolean(supabaseUrl),
            hasSupabaseAnonKey: Boolean(anonKey),
            hasSupabaseServiceRoleKey: Boolean(serviceRoleKey),
            hasStreamApiKey: Boolean(streamApiKey),
            hasStreamApiSecret: Boolean(streamApiSecret),
          },
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Missing authorization token.",
        },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "").trim();

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized user.",
          details: userError?.message || null,
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const receiverId =
      typeof body?.receiverId === "string" ? body.receiverId.trim() : "";

    const callType = body?.callType;

    if (!receiverId || !["audio", "video"].includes(callType)) {
      return NextResponse.json(
        {
          error: "Invalid receiverId or callType.",
        },
        { status: 400 }
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        {
          error: "You cannot call yourself.",
        },
        { status: 400 }
      );
    }

    const {
      data: callerProfile,
      error: callerProfileError,
    } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (callerProfileError || !callerProfile) {
      return NextResponse.json(
        {
          error: "Caller profile not found.",
          details: callerProfileError?.message || null,
        },
        { status: 404 }
      );
    }

    if (!canSendMessages(callerProfile)) {
      return NextResponse.json(
        {
          error:
            "Premium or VIP membership is required for Matchups messaging and calls.",
        },
        { status: 403 }
      );
    }

    const {
      data: receiverProfile,
      error: receiverProfileError,
    } = await adminClient
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", receiverId)
      .single();

    if (receiverProfileError || !receiverProfile) {
      return NextResponse.json(
        {
          error: "Receiver profile not found.",
          details: receiverProfileError?.message || null,
        },
        { status: 404 }
      );
    }

    if (callType === "audio" && !canStartAudioCall(callerProfile)) {
      return NextResponse.json(
        {
          error: "Premium or VIP membership is required for audio calls.",
        },
        { status: 403 }
      );
    }

    if (callType === "video" && !canStartVideoCall(callerProfile)) {
      return NextResponse.json(
        {
          error: "Premium or VIP membership is required for video calls.",
        },
        { status: 403 }
      );
    }

    const streamCallId = `matchup-${callType}-${crypto.randomUUID()}`;

    const {
      data: callRow,
      error: callInsertError,
    } = await adminClient
      .from("matchup_calls")
      .insert({
        caller_id: user.id,
        receiver_id: receiverId,
        call_type: callType,
        stream_call_id: streamCallId,
        status: "initiated",
      })
      .select("*")
      .single();

    if (callInsertError || !callRow) {
      console.error("CALL INSERT ERROR", {
        message: callInsertError?.message,
        details: callInsertError?.details,
        hint: callInsertError?.hint,
        code: callInsertError?.code,
      });

      return NextResponse.json(
        {
          error: "Unable to create call row.",
          details: callInsertError?.message || null,
          hint: callInsertError?.hint || null,
          code: callInsertError?.code || null,
        },
        { status: 500 }
      );
    }

    try {
      const streamClient = new StreamClient(
        streamApiKey,
        streamApiSecret
      );

      const streamCall = streamClient.video.call(
        "default",
        streamCallId
      );

      await streamCall.getOrCreate({
        ring: true,
        video: callType === "video",
        data: {
          created_by_id: user.id,
          members: [
            {
              user_id: user.id,
            },
            {
              user_id: receiverId,
            },
          ],
          custom: {
            matchup_call_id: callRow.id,
            call_type: callType,
            caller_name:
              callerProfile.full_name || "Delly's Matchups Member",
            receiver_name:
              receiverProfile.full_name || "Delly's Matchups Member",
          },
        },
      });
    } catch (streamError) {
      console.error("STREAM CALL CREATE ERROR", streamError);

      const { error: rollbackError } = await adminClient
        .from("matchup_calls")
        .delete()
        .eq("id", callRow.id);

      if (rollbackError) {
        console.error("CALL ROLLBACK ERROR", rollbackError);
      }

      return NextResponse.json(
        {
          error: "Unable to ring the member.",
          details: getErrorMessage(streamError),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      call: callRow,
    });
  } catch (error) {
    console.error("CALL START ROUTE ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to start call.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
