// src/app/api/cron/payment-reminders/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  assertCronAuth,
  daysUntil,
  getNotificationPreferences,
  hasBillingCycleEmail,
  sendTrackedEmail,
} from "@/lib/email/notifications";
import { buildPaymentReminderEmail } from "@/lib/email/templates";

function getReminderType(daysLeft) {
  if (daysLeft === 7) return "payment_reminder_7d";
  if (daysLeft === 3) return "payment_reminder_3d";
  if (daysLeft === 1) return "payment_reminder_1d";
  return null;
}

export async function GET(request) {
  try {
    assertCronAuth(request);

    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,email,membership_status,membership_expires_at")
      .in("membership_status", ["premium", "vip"])
      .not("email", "is", null)
      .not("membership_expires_at", "is", null);

    if (error) {
      throw new Error(error.message);
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users || []) {
      const daysLeft = daysUntil(user.membership_expires_at);
      const emailType = getReminderType(daysLeft);

      if (!emailType) {
        skipped += 1;
        continue;
      }

      const prefs = await getNotificationPreferences(user.id);

      if (!prefs.payment_reminder_enabled) {
        skipped += 1;
        continue;
      }

      const billingCycleKey = `${user.id}:${user.membership_expires_at}:${emailType}`;
      const alreadySent = await hasBillingCycleEmail({ billingCycleKey });

      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const template = buildPaymentReminderEmail({
        fullName: user.full_name,
        membershipStatus: user.membership_status,
        expiresAt: user.membership_expires_at,
        daysLeft,
      });

      const result = await sendTrackedEmail({
        userId: user.id,
        emailType,
        billingCycleKey,
        to: user.email,
        subject: template.subject,
        html: template.html,
      });

      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status }
    );
  }
}

