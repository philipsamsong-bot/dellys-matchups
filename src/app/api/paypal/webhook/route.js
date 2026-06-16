import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseCustomId(customId) {
  try {
    return JSON.parse(customId || "{}");
  } catch {
    return {};
  }
}

export async function POST(request) {
  try {
    const event = await request.json();
    const eventType = event.event_type;
    const resource = event.resource || {};
    const customData = parseCustomId(resource.custom_id);

    const userId = customData.userId;
    const plan = customData.plan;
    const subscriptionId = resource.id || null;

    if (!userId || !plan) {
      return NextResponse.json({ received: true });
    }

    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
      await supabase
        .from("profiles")
        .update({
          membership_plan: plan,
          subscription_status: "active",
          paypal_subscription_id: subscriptionId,
          vip_badge: plan === "vip",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    if (
      eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
      eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
      eventType === "BILLING.SUBSCRIPTION.EXPIRED"
    ) {
      await supabase
        .from("profiles")
        .update({
          membership_plan: "free",
          subscription_status: "inactive",
          vip_badge: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
