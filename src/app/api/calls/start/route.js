// src/app/api/calls/start/route.js

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

function isPaidMembership(value) {
  return value === "premium" || value === "vip";
}

function getEffectiveMembership(profile) {
  const membershipValues = [
    profile?.membership_status,
    profile?.membership_plan,
    profile?.plan,
    profile?.subscription,
  ]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim().toLowerCase());

  if (membershipValues.includes("vip")) {
    return "vip";
  }

  if (membershipValues.includes("premium")) {
    return "premium";
  }

  return "free";
}

function canStartAudioCall(profile) {
  return isPaidMembership(
    getEffectiveMembership(profile),
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

    const receiverId =
      typeof body?.receiverId === "string"
        ? body.receiverId.trim()
        : "";

    const callType =
      typeof body?.callType === "string"
        ? body.callType.trim().toLowerCase()
        : "";

    if (!receiverId) {
      return NextResponse.json(
        {
          error: "Receiver ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (callType !== "audio") {
      return NextResponse.json(
        {
          error:
            "Only audio calls are currently available.",
        },
        {
          status: 400,
        },
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        {
          error: "You cannot call yourself.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: callerProfile,
      error: callerProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        [
          "id",
          "full_name",
          "membership_status",
          "membership_plan",
          "plan",
          "subscription",
        ].join(","),
      )
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfileError) {
      console.error(
        "CALL START CALLER PROFILE ERROR:",
        callerProfileError,
      );

      return NextResponse.json(
        {
          error: "Unable to load caller profile.",
        },
        {
          status: 500,
        },
      );
    }

    if (!callerProfile) {
      return NextResponse.json(
        {
          error: "Caller profile not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!canStartAudioCall(callerProfile)) {
      return NextResponse.json(
        {
          error:
            "Premium or VIP membership is required for audio calls.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      data: receiverProfile,
      error: receiverProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", receiverId)
      .maybeSingle();

    if (receiverProfileError) {
      console.error(
        "CALL START RECEIVER PROFILE ERROR:",
        receiverProfileError,
      );

      return NextResponse.json(
        {
          error: "Unable to load receiver profile.",
        },
        {
          status: 500,
        },
      );
    }

    if (!receiverProfile) {
      return NextResponse.json(
        {
          error: "Receiver profile not found.",
        },
        {
          status: 404,
        },
      );
    }

    const streamCallId =
      `matchup-audio-${crypto.randomUUID()}`;

    const {
      data: callRow,
      error: callInsertError,
    } = await supabaseAdmin
      .from("matchup_calls")
      .insert({
        caller_id: user.id,
        receiver_id: receiverId,
        call_type: "audio",
        stream_call_id: streamCallId,
        status: "initiated",
      })
      .select("*")
      .single();

    if (callInsertError || !callRow) {
      console.error(
        "CALL START INSERT ERROR:",
        callInsertError,
      );

      return NextResponse.json(
        {
          error: "Unable to create call.",
        },
        {
          status: 500,
        },
      );
    }

    try {
      const streamClient = createStreamClient();

      const streamCall =
        streamClient.video.call(
          "default",
          streamCallId,
        );

      await streamCall.getOrCreate({
        ring: true,
        video: false,
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
            matchup_call_id:
              callRow.id,
            call_type: "audio",
            caller_name:
              callerProfile.full_name ||
              "Delly's Matchups Member",
            receiver_name:
              receiverProfile.full_name ||
              "Delly's Matchups Member",
          },
        },
      });
    } catch (streamError) {
      console.error(
        "STREAM AUDIO CALL CREATE ERROR:",
        streamError,
      );

      const {
        error: rollbackError,
      } = await supabaseAdmin
        .from("matchup_calls")
        .delete()
        .eq("id", callRow.id);

      if (rollbackError) {
        console.error(
          "CALL START ROLLBACK ERROR:",
          rollbackError,
        );
      }

      return NextResponse.json(
        {
          error:
            "Unable to start the audio call.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      call: callRow,
    });
  } catch (error) {
    console.error(
      "CALL START ROUTE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to start call.",
      },
      {
        status: 500,
      },
    );
  }
}
