// src/app/api/stream/token/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamClient } from "@stream-io/node-sdk";

const TOKEN_VALIDITY_SECONDS = 60 * 60;

function createSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

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

  return {
    authClient,
    adminClient,
  };
}

function createStreamClient() {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Stream server environment variables are missing.");
  }

  return {
    apiKey,
    client: new StreamClient(apiKey, apiSecret),
  };
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

export async function POST(request) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const { authClient, adminClient } = createSupabaseClients();

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized user." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "Profile not found.",
          details: profileError?.message || null,
        },
        { status: 404 }
      );
    }

    const { apiKey, client: streamClient } = createStreamClient();

    await streamClient.upsertUsers({
      users: {
        [user.id]: {
          id: user.id,
          role: "user",
          name: profile.full_name || "Delly's Matchups Member",
          image: profile.avatar_url || undefined,
        },
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
        name: profile.full_name || "Delly's Matchups Member",
        image: profile.avatar_url || null,
      },
    });
  } catch (error) {
    console.error("STREAM TOKEN ROUTE ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to create Stream token.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}
