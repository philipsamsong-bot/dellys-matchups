// src/lib/email/resend.js
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom =
  process.env.EMAIL_FROM || "Delly's Matchups <support@dellysmatchups.org>";

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY.");
}

const resend = new Resend(resendApiKey);

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email.");
  }

  return data;
}
