// src/app/api/cron/upgrade-reminders/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  assertCronAuth,
  getNotificationPreferences,
  hasRecentEmail,
  sendTrackedEmail,
} from "@/lib/email/notifications";
import { buildUpgradeEmail } from "@/lib/email/templates";

export async function GET(request) {
  try {
    assertCronAuth(request);

    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,email,membership_status,created_at")
      .eq("membership_status", "free")
      .not("email", "is", null)
      .lte("created_at", threeDaysAgo);

    if (error) {
      throw new Error(error.message);
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users || []) {
      const prefs = await getNotificationPreferences(user.id);

      if (!prefs.marketing_email_enabled) {
        skipped += 1;
        continue;
      }

      const recentlySent = await hasRecentEmail({
        userId: user.id,
        emailType: "upgrade_nudge",
        sinceIso: sevenDaysAgo,
      });

      if (recentlySent) {
        skipped += 1;
        continue;
      }

      const template = buildUpgradeEmail({
        fullName: user.full_name,
      });

      const result = await sendTrackedEmail({
        userId: user.id,
        emailType: "upgrade_nudge",
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
