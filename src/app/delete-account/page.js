// src/app/delete-account/page.js

import { SiteFooter, SiteNav } from "@/app/components/SiteChrome";

export const metadata = {
  title: "Delete Your Account | Delly's Matchups",
  description:
    "Instructions for requesting deletion of your Delly's Matchups account and associated personal data.",
};

const DELETE_EMAIL = "info@dellysmatchups.org";
const DELETE_SUBJECT = "Account Deletion Request";

export default function DeleteAccountPage() {
  const emailHref = `mailto:${DELETE_EMAIL}?subject=${encodeURIComponent(
    DELETE_SUBJECT
  )}`;

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-xl md:p-14">
          <p className="font-bold uppercase tracking-[0.35em] text-red-100">
            Account &amp; Privacy
          </p>

          <h1 className="font-display mt-4 text-5xl font-bold leading-none md:text-7xl">
            Delete Your Account
          </h1>

          <div className="mt-8 space-y-6 leading-8 text-white/75">
            <p>
              Delly&apos;s Matchups Ltd allows users to request deletion of
              their Delly&apos;s Matchups account and associated personal data.
            </p>

            <p>
              You do not need to purchase anything to make an account deletion
              request.
            </p>
          </div>

          <div className="mt-16 space-y-14">
            <PolicySection title="1. How to Request Account Deletion">
              <p>
                To request deletion of your Delly&apos;s Matchups account,
                email:
              </p>

              <a
                href={emailHref}
                className="inline-flex rounded-2xl bg-white px-6 py-3 font-bold text-[#b30018] transition hover:scale-105"
              >
                {DELETE_EMAIL}
              </a>

              <p>
                Please send the request from the email address connected to
                your Delly&apos;s Matchups account whenever possible.
              </p>

              <p>
                Use the subject line:
                <strong className="ml-2 text-white">
                  Account Deletion Request
                </strong>
              </p>
            </PolicySection>

            <PolicySection title="2. Information to Include">
              <p>
                Please include enough information for us to identify the
                correct account.
              </p>

              <PolicyList
                items={[
                  "Your full name",
                  "The email address connected to your Delly's Matchups account",
                  "A clear statement that you want your account deleted",
                ]}
              />

              <p>
                We may ask you to verify that you are the account holder before
                completing the deletion request.
              </p>
            </PolicySection>

            <PolicySection title="3. What Happens After Your Request">
              <p>
                Once your identity and request have been verified, we will
                process the deletion of your account and eligible associated
                personal information.
              </p>

              <p>
                Account information that may be deleted includes, where
                applicable:
              </p>

              <PolicyList
                items={[
                  "Profile information",
                  "Profile photographs",
                  "Matchmaking preferences",
                  "Account-related personal information",
                  "Eligible messages and user-generated information",
                  "Other personal information that is no longer required for a lawful purpose",
                ]}
              />
            </PolicySection>

            <PolicySection title="4. Information We May Need to Retain">
              <p>
                Some information may not be deleted immediately where we are
                legally required or otherwise permitted to retain it.
              </p>

              <p>This may include information required for:</p>

              <PolicyList
                items={[
                  "Accounting and financial record-keeping",
                  "Payment and transaction records",
                  "Fraud prevention",
                  "Security and abuse investigations",
                  "Safety records",
                  "Legal claims or disputes",
                  "Compliance with applicable laws and regulatory obligations",
                ]}
              />

              <p>
                Any information that must be retained will only be kept for as
                long as reasonably necessary for the applicable legal,
                security, accounting or operational purpose.
              </p>
            </PolicySection>

            <PolicySection title="5. Memberships and Subscriptions">
              <p>
                Deleting your Delly&apos;s Matchups account does not
                necessarily cancel an active subscription managed by an
                external billing provider.
              </p>

              <p>
                If you have an active subscription through Google Play,
                PayPal, or another payment provider, you should also cancel
                that subscription through the relevant provider to prevent
                future renewals.
              </p>
            </PolicySection>

            <PolicySection title="6. Processing Time">
              <p>
                We aim to process verified account deletion requests within a
                reasonable period.
              </p>

              <p>
                Certain information may remain temporarily in secure backups
                before being removed through normal backup-retention processes.
              </p>
            </PolicySection>

            <PolicySection title="7. Partial Data Deletion Requests">
              <p>
                If you do not want to delete your entire account but want to
                request access, correction or deletion of specific personal
                information, you may contact us at{" "}
                <a
                  href={`mailto:${DELETE_EMAIL}`}
                  className="font-semibold text-white underline underline-offset-4"
                >
                  {DELETE_EMAIL}
                </a>
                .
              </p>

              <p>
                Such requests will be handled in accordance with applicable
                data-protection law and our Privacy Policy.
              </p>
            </PolicySection>

            <PolicySection title="8. Privacy Policy">
              <p>
                More information about how Delly&apos;s Matchups collects,
                uses, stores and protects personal information is available in
                our Privacy Policy.
              </p>

              <a
                href="/privacy"
                className="font-semibold text-white underline underline-offset-4 hover:text-red-100"
              >
                View Privacy Policy
              </a>
            </PolicySection>

            <PolicySection title="9. Contact">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="font-bold text-white">
                  DELLY&apos;S MATCHUPS LTD
                </p>

                <p className="mt-3">
                  Account deletion and privacy requests:
                </p>

                <p className="mt-2">
                  <a
                    href={`mailto:${DELETE_EMAIL}`}
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    {DELETE_EMAIL}
                  </a>
                </p>

                <p className="mt-3">
                  Website:{" "}
                  <a
                    href="https://www.dellysmatchups.org"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    www.dellysmatchups.org
                  </a>
                </p>
              </div>
            </PolicySection>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function PolicySection({ title, children }) {
  return (
    <section>
      <h2 className="text-3xl font-black">{title}</h2>

      <div className="mt-5 space-y-5 leading-8 text-white/75">
        {children}
      </div>
    </section>
  );
}

function PolicyList({ items }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}
