// src/app/api/stream/token/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamClient } from "@stream-io/node-sdk";

export const runtime = "nodejs";

const TOKEN_VALIDITY_SECONDS = 60 * 60;

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
  const apiKey = getRequiredEnvironmentVariable("STREAM_API_KEY");
  const apiSecret = getRequiredEnvironmentVariable("STREAM_API_SECRET");

  return {
    apiKey,
    client: new StreamClient(apiKey, apiSecret),
  };
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
    const accessToken = getBearerToken(request);

    if (!accessToken) {
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
    } = await supabaseAdmin.auth.getUser(accessToken);

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

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("STREAM PROFILE LOOKUP ERROR:", profileError);

      return NextResponse.json(
        {
          error: "Unable to load user profile.",
        },
        {
          status: 500,
        },
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error: "Profile not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      apiKey,
      client: streamClient,
    } = createStreamClient();

    const streamUser = {
      id: user.id,
      role: "user",
      name:
        profile.full_name ||
        "Delly's Matchups Member",
    };

    if (profile.avatar_url) {
      streamUser.image = profile.avatar_url;
    }

    await streamClient.upsertUsers({
      users: {
        [user.id]: streamUser,
      },
    });

    const token = streamClient.generateUserToken({
      user_id: user.id,
      validity_in_seconds: TOKEN_VALIDITY_SECONDS,
    });

    return NextResponse.json({
      success: true,
      apiKey,
      token,
      user: {
        id: user.id,
        name: streamUser.name,
        image: profile.avatar_url || null,
      },
      expiresIn: TOKEN_VALIDITY_SECONDS,
    });
  } catch (error) {
    console.error("STREAM TOKEN ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to create Stream token.",
      },
      {
        status: 500,
      },
    );
  }
}
