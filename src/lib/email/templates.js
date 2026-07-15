// src/lib/email/templates.js
const BRAND_RED = "#b30018";
const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.dellysmatchups.org";

function wrapEmail({ title, bodyHtml }) {
  return `
    <div style="margin:0;padding:0;background:#f6f6f8;">
      <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
        <div style="background:${BRAND_RED};border-radius:28px;padding:36px 28px;color:#ffffff;font-family:Arial,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,0.12);">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="${APP_URL}/dellys-logo.webp" alt="Delly's Matchups" style="height:72px;width:auto;display:inline-block;" />
          </div>
          <h1 style="margin:0 0 18px;font-size:38px;line-height:1.1;font-weight:800;text-align:center;color:#ffffff;">
            ${title}
          </h1>
          ${bodyHtml}
          <p style="margin:28px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.78);text-align:center;">
            Delly's Matchups · support@dellysmatchups.org
          </p>
        </div>
      </div>
    </div>
  `;
}

function ctaButton(label, href) {
  return `
    <div style="text-align:center;margin:24px 0 12px;">
      <a href="${href}" style="display:inline-block;background:#ffffff;color:${BRAND_RED};text-decoration:none;padding:14px 28px;border-radius:999px;font-size:16px;font-weight:800;">
        ${label}
      </a>
    </div>
  `;
}

export function buildUpgradeEmail({ fullName }) {
  const name = fullName?.trim() || "there";

  return {
    subject: "Upgrade your Delly's Matchups experience",
    html: wrapEmail({
      title: "Unlock more on Delly’s Matchups",
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:17px;line-height:1.8;color:rgba(255,255,255,0.92);text-align:center;">
          Hi ${name},
        </p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:rgba(255,255,255,0.9);text-align:center;">
          Upgrade your account to enjoy a better experience on the platform with more visibility, more access, and more connection opportunities.
        </p>
        <p style="margin:0 0 8px;font-size:16px;line-height:1.8;color:rgba(255,255,255,0.9);text-align:center;">
          Premium and VIP members get the best Delly’s Matchups experience.
        </p>
        ${ctaButton("Upgrade Now", `${APP_URL}/matchups/checkout?plan=premium`)}
        <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.78);text-align:center;">
          You’re receiving this because you have a Delly’s Matchups account.
        </p>
      `,
    }),
  };
}

export function buildPaymentReminderEmail({
  fullName,
  membershipStatus,
  expiresAt,
  daysLeft,
}) {
  const name = fullName?.trim() || "there";
  const planLabel = membershipStatus === "vip" ? "VIP" : "Premium";
  const expiryText = new Date(expiresAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const headline =
    daysLeft === 1
      ? "Your membership expires tomorrow"
      : daysLeft === 0
        ? "Your membership expires today"
        : `Your membership expires in ${daysLeft} days`;

  return {
    subject: `${planLabel} membership renewal reminder`,
    html: wrapEmail({
      title: headline,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:17px;line-height:1.8;color:rgba(255,255,255,0.92);text-align:center;">
          Hi ${name},
        </p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:rgba(255,255,255,0.9);text-align:center;">
          Your ${planLabel} membership is due on <strong>${expiryText}</strong>.
        </p>
        <p style="margin:0 0 8px;font-size:16px;line-height:1.8;color:rgba(255,255,255,0.9);text-align:center;">
          Renew in time so you continue enjoying the full Delly’s Matchups experience without interruption.
        </p>
        ${ctaButton("Renew Membership", `${APP_URL}/matchups/checkout?plan=${membershipStatus}`)}
      `,
    }),
  };
}
