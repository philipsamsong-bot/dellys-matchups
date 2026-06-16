import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Error("Not authenticated.");
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid session.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { data, error } = await supabaseAdmin
      .from("exceptional_cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cases: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("exceptional_cases").insert({
      title: body.title,
      anonymous_name: body.anonymous_name || "Anonymous",
      image_url: body.image_url || "",
      content: body.content,
      published: Boolean(body.published),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const { error } = await supabaseAdmin
      .from("exceptional_cases")
      .update({ published: Boolean(body.published) })
      .eq("id", body.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const { error } = await supabaseAdmin
      .from("exceptional_cases")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
