// src/lib/email/notifications.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/resend";

export function assertCronAuth(request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new Error("Unauthorized");
  }
}

export async function getNotificationPreferences(userId) {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("marketing_email_enabled,payment_reminder_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (
    data || {
      marketing_email_enabled: true,
      payment_reminder_enabled: true,
    }
  );
}

export async function hasRecentEmail({ userId, emailType, sinceIso }) {
  const { data, error } = await supabaseAdmin
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .gte("sent_at", sinceIso)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function hasBillingCycleEmail({ billingCycleKey }) {
  const { data, error } = await supabaseAdmin
    .from("email_logs")
    .select("id")
    .eq("billing_cycle_key", billingCycleKey)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function logEmail({
  userId,
  emailType,
  subject,
  sentTo,
  status,
  billingCycleKey = null,
  metadata = {},
}) {
  const { error } = await supabaseAdmin.from("email_logs").insert({
    user_id: userId,
    email_type: emailType,
    subject,
    sent_to: sentTo,
    status,
    billing_cycle_key: billingCycleKey,
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendTrackedEmail({
  userId,
  emailType,
  billingCycleKey = null,
  to,
  subject,
  html,
}) {
  try {
    const response = await sendEmail({
      to,
      subject,
      html,
    });

    await logEmail({
      userId,
      emailType,
      subject,
      sentTo: to,
      status: "sent",
      billingCycleKey,
      metadata: {
        resendId: response?.id || null,
      },
    });

    return { ok: true };
  } catch (error) {
    await logEmail({
      userId,
      emailType,
      subject,
      sentTo: to,
      status: "failed",
      billingCycleKey,
      metadata: {
        error: error.message,
      },
    });

    return {
      ok: false,
      error: error.message,
    };
  }
}

export function daysUntil(dateValue) {
  const now = new Date();
  const target = new Date(dateValue);

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  return Math.round((startOfTarget - startOfToday) / 86400000);
}
