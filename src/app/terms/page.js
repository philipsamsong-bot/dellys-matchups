// src/app/terms/page.js

import { SiteFooter, SiteNav } from "@/app/components/SiteChrome";

export const metadata = {
  title: "Terms & Conditions | Delly's Matchups",
  description:
    "Terms and Conditions governing use of Delly's Matchups website, mobile application, matchmaking, counselling, Academy, shop and related services.",
};

const GENERAL_EMAIL = "infodellysmatchups@gmail.com";
const SUPPORT_EMAIL = "support@dellysmatchups.org";
const LEGAL_EMAIL = "info@dellysmatchups.org";
const WEBSITE_URL = "https://www.dellysmatchups.org";

export default function TermsPage() {
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-xl md:p-14">
          <p className="font-bold uppercase tracking-[0.35em] text-red-100">
            Legal
          </p>

          <h1 className="font-display mt-4 text-5xl font-bold leading-none md:text-7xl">
            Terms &amp; Conditions
          </h1>

          <div className="mt-8 space-y-6 text-white/75">
            <p>
              <strong>Effective Date:</strong> May 2026
            </p>

            <p>
              <strong>Last Updated:</strong> 12 September 2026
            </p>

            <p className="leading-8">
              Welcome to Delly&apos;s Matchups (&quot;DMs&quot;,
              &quot;Delly&apos;s Matchups&quot;, &quot;we&quot;,
              &quot;our&quot; or &quot;us&quot;).
            </p>

            <p className="leading-8">
              These Terms &amp; Conditions govern your access to and use of
              our website, platform, mobile application, matchmaking services,
              counselling and mentorship services, Academy programmes, shop,
              communication features and related services.
            </p>

            <p className="leading-8">
              By creating an account, purchasing a product or service, or
              otherwise using Delly&apos;s Matchups, you agree to comply with
              and be bound by these Terms &amp; Conditions.
            </p>
          </div>

          <div className="mt-16 space-y-14">
            <PolicySection title="1. Company Information">
              <p className="font-bold text-white">
                DELLY&apos;S MATCHUPS LTD
              </p>

              <p>Company Number: 17251701</p>
              <p>Registered in England &amp; Wales</p>

              <p>
                General Contact:{" "}
                <EmailLink email={GENERAL_EMAIL} />
              </p>

              <p>
                Customer Support:{" "}
                <EmailLink email={SUPPORT_EMAIL} />
              </p>

              <p>
                Legal &amp; Privacy:{" "}
                <EmailLink email={LEGAL_EMAIL} />
              </p>

              <p>
                Website:{" "}
                <a
                  href={WEBSITE_URL}
                  className="font-semibold text-white underline underline-offset-4"
                >
                  www.dellysmatchups.org
                </a>
              </p>
            </PolicySection>

            <PolicySection title="2. Our Foundation and Values">
              <p>
                Delly&apos;s Matchups was founded on Biblical principles with
                the mission of promoting healthy, authentic and meaningful
                relationships rooted in godly values.
              </p>

              <p>
                By joining Delly&apos;s Matchups, users agree to conduct
                themselves respectfully and responsibly and to comply with the
                standards and rules governing the platform.
              </p>
            </PolicySection>

            <PolicySection title="3. Eligibility">
              <PolicyList
                items={[
                  "You must be at least 18 years old to create an account or use the matchmaking features",
                  "Information provided must be truthful and reasonably accurate",
                  "The platform must only be used lawfully and respectfully",
                  "Users must comply with these Terms and applicable community standards",
                  "Users must have legal capacity to enter into agreements and make purchases where applicable",
                ]}
              />
            </PolicySection>

            <PolicySection title="4. Relationship Matching Policy">
              <p>
                Delly&apos;s Matchups is a faith-based platform whose
                matchmaking service is designed around its stated Biblical
                relationship principles and community values.
              </p>

              <p>
                Users who participate in matchmaking are expected to understand
                and respect the purpose, values and relationship framework
                presented by the platform.
              </p>
            </PolicySection>

            <PolicySection title="5. Monogamous Relationship Policy">
              <PolicyList
                items={[
                  "Married individuals may not join or use Delly's Matchups for matchmaking purposes",
                  "Married individuals may not create or maintain an active matchmaking profile",
                  "Married individuals may still access eligible Academy, counselling, mentorship, shop, article and educational services",
                  "Matchmaking users must be single, divorced or widowed",
                  "Users must not use the matchmaking service to facilitate adultery, infidelity or undisclosed concurrent relationships",
                ]}
              />
            </PolicySection>

            <PolicySection title="6. User Accounts">
              <p>
                You are responsible for maintaining the confidentiality and
                security of your account credentials.
              </p>

              <p>
                You must not allow another person to impersonate you or use
                your account in a misleading or unauthorised manner.
              </p>

              <p>
                You should notify us if you believe your account has been
                compromised or accessed without permission.
              </p>
            </PolicySection>

            <PolicySection title="7. User Conduct and Community Standards">
              <p>
                Users are expected to behave respectfully and responsibly at
                all times to help maintain a safe, wholesome and
                faith-aligned environment.
              </p>

              <p>
                Conduct that is fraudulent, threatening, abusive, harassing,
                exploitative, unlawful or deliberately harmful to another
                person or to the platform is prohibited.
              </p>
            </PolicySection>

            <PolicySection title="8. Inappropriate Images and Media">
              <PolicyList
                items={[
                  "Nude or sexually explicit images are prohibited",
                  "Pornographic material is prohibited",
                  "Sexually exploitative or abusive content is prohibited",
                  "Shared profile or communication media must comply with platform standards",
                  "Content that violates applicable law or the rights of another person is prohibited",
                ]}
              />
            </PolicySection>

            <PolicySection title="9. Explicit or Inappropriate Communications">
              <p>
                Sharing nude images, sexually explicit recordings, abusive
                communications or other prohibited material may result in
                content removal, account restriction, suspension or permanent
                removal.
              </p>

              <p>
                Serious matters may also be reported to appropriate authorities
                where legally required or reasonably necessary to address
                safety concerns.
              </p>
            </PolicySection>

            <PolicySection title="10. External Contact Sharing">
              <p>
                Users should exercise caution before sharing personal contact
                information with other users, particularly during early
                interactions.
              </p>

              <p>
                Delly&apos;s Matchups is not responsible for interactions that
                take place outside the platform, although violations reported
                to us may be reviewed where they affect user or platform
                safety.
              </p>
            </PolicySection>

            <PolicySection title="11. Financial Transactions and Solicitation">
              <PolicyList
                items={[
                  "Users must not solicit money from other matchmaking users through deceptive, manipulative or fraudulent means",
                  "Fraud, scams, financial exploitation and deceptive requests for money are prohibited",
                  "Users should not send money to strangers or people they have not independently verified",
                  "Delly's Matchups is not responsible for unauthorised financial arrangements made directly between users outside our approved payment systems",
                ]}
              />
            </PolicySection>

            <PolicySection title="12. Harassment, Abuse and Misconduct">
              <PolicyList
                items={[
                  "Bullying and intimidation are prohibited",
                  "Threats and abusive conduct are prohibited",
                  "Harassment and stalking behaviour are prohibited",
                  "Discriminatory abuse or targeted hostility is prohibited",
                  "Conduct that creates a credible safety risk may result in immediate restriction or removal",
                ]}
              />
            </PolicySection>

            <PolicySection title="13. Safety and User Responsibility">
              <p>
                Users are responsible for exercising reasonable caution,
                verifying information where appropriate and making informed
                decisions when communicating with or meeting other users.
              </p>

              <p>
                Delly&apos;s Matchups does not guarantee the identity,
                background, intentions, conduct or compatibility of any user.
              </p>

              <p>
                Users should take reasonable precautions when arranging
                in-person meetings and should avoid sharing sensitive financial
                information unnecessarily.
              </p>
            </PolicySection>

            <PolicySection title="14. Privacy and Confidentiality">
              <p>
                Users must respect the privacy of others and must not
                unlawfully publish, distribute or misuse another person&apos;s
                private communications, photographs or personal information.
              </p>

              <p>
                Our handling of personal information is described in our{" "}
                <PolicyLink href="/privacy">
                  Privacy Policy
                </PolicyLink>
                .
              </p>
            </PolicySection>

            <PolicySection title="15. Content Moderation and Enforcement">
              <p>
                Delly&apos;s Matchups may review reported content or conduct
                and may remove content, restrict functionality, suspend
                accounts or terminate access where reasonably necessary to
                enforce these Terms, protect users or comply with law.
              </p>

              <p>
                Enforcement decisions may take into account the seriousness,
                frequency and context of the conduct involved.
              </p>
            </PolicySection>

            <PolicySection title="16. User-Generated Content">
              <p>
                You remain responsible for photographs, profile information,
                messages and other content you submit to Delly&apos;s Matchups.
              </p>

              <p>
                You must have the necessary rights and permissions to upload or
                share that content.
              </p>

              <p>
                By submitting content that is intended to be displayed through
                the platform, you grant Delly&apos;s Matchups the permissions
                reasonably necessary to host, store, process and display that
                content for the purpose of operating the relevant service.
              </p>
            </PolicySection>

            <PolicySection title="17. Intellectual Property">
              <p>
                Delly&apos;s Matchups branding, graphics, original articles,
                course materials, videos, resources, designs and other
                proprietary materials remain the intellectual property of
                Delly&apos;s Matchups Ltd or the relevant rights holder unless
                otherwise stated.
              </p>

              <p>
                You may not copy, reproduce, sell, redistribute or commercially
                exploit protected Delly&apos;s Matchups content without
                permission or another lawful basis.
              </p>
            </PolicySection>

            <PolicySection title="18. Matchmaking Disclaimer">
              <p>
                Delly&apos;s Matchups provides tools and services intended to
                help people connect, but does not guarantee compatibility,
                engagement, marriage, relationship success or any particular
                outcome.
              </p>

              <p>
                Users remain responsible for their own decisions, interactions
                and relationships.
              </p>
            </PolicySection>

            <PolicySection title="19. Counselling and Mentorship Disclaimer">
              <p>
                Delly&apos;s Matchups counselling, mentorship, coaching and
                relationship support services are intended to provide guidance,
                education, mentoring and personal support.
              </p>

              <p>
                Unless a particular service expressly states otherwise, these
                services are not presented as emergency, medical, psychiatric,
                legal or other regulated professional services.
              </p>

              <p>
                Users requiring urgent medical or emergency assistance should
                contact an appropriate emergency or healthcare service.
              </p>
            </PolicySection>

            <PolicySection title="20. Counselling Conduct and Appointments">
              <p>
                Clients participating in counselling, mentorship or coaching
                are expected to communicate respectfully.
              </p>

              <p>
                Delly&apos;s Matchups may end, refuse or cancel a session where
                a participant behaves in a threatening, abusive, harassing,
                disrespectful or unsafe manner.
              </p>

              <p>
                Cancellation, rescheduling and refund rules for counselling
                appointments are explained in our{" "}
                <PolicyLink href="/cancellation-refund-policy">
                  Cancellation &amp; Refund Policy
                </PolicyLink>
                .
              </p>
            </PolicySection>

            <PolicySection title="21. Academy Programmes and Digital Content">
              <p>
                Academy programmes, courses, recordings, downloads and other
                digital materials may have eligibility, access and payment
                requirements displayed at or before purchase.
              </p>

              <p>
                Academy and digital content may not be copied, redistributed,
                resold or made publicly available without permission.
              </p>

              <p>
                Cancellation and refund rights relating to Academy programmes
                and digital content are addressed in our{" "}
                <PolicyLink href="/cancellation-refund-policy">
                  Cancellation &amp; Refund Policy
                </PolicyLink>
                .
              </p>
            </PolicySection>

            <PolicySection title="22. Shop Purchases">
              <p>
                Physical and digital products may be offered through the
                Delly&apos;s Matchups shop.
              </p>

              <p>
                Product descriptions, pricing, availability and delivery
                information may vary depending on the item and destination.
              </p>

              <p>
                Cancellation, return and refund rights relating to shop
                purchases are governed by applicable consumer law and our{" "}
                <PolicyLink href="/cancellation-refund-policy">
                  Cancellation &amp; Refund Policy
                </PolicyLink>
                .
              </p>
            </PolicySection>

            <PolicySection title="23. Payments, Memberships and Subscriptions">
              <p>
                Premium and VIP memberships may be offered as recurring
                subscriptions or paid-access plans.
              </p>

              <p>
                Other services, including shop purchases, counselling
                bookings, Academy programmes, books, digital resources and
                events, may be charged separately.
              </p>

              <p>
                Available payment methods may include third-party payment
                providers and approved manual payment methods.
              </p>

              <p>
                Payments are processed by or on behalf of DELLY&apos;S
                MATCHUPS LTD, Company Number 17251701, registered in England
                &amp; Wales, together with applicable third-party payment
                providers.
              </p>

              <p>
                If a purchase is made through an app store or another external
                billing provider, additional payment, cancellation and refund
                terms imposed by that provider may apply.
              </p>
            </PolicySection>

            <PolicySection title="24. Cancellations and Refunds">
              <p>
                Cancellation, rescheduling, returns and refund eligibility vary
                according to the product or service purchased.
              </p>

              <p>
                The applicable rules are set out in our{" "}
                <PolicyLink href="/cancellation-refund-policy">
                  Cancellation &amp; Refund Policy
                </PolicyLink>
                .
              </p>

              <p>
                Nothing in these Terms or the Cancellation &amp; Refund Policy
                is intended to exclude rights that cannot lawfully be excluded
                under applicable consumer protection law.
              </p>
            </PolicySection>

            <PolicySection title="25. Third-Party Services">
              <p>
                Delly&apos;s Matchups may rely on third-party providers for
                hosting, authentication, payments, communications, email,
                storage and other operational services.
              </p>

              <p>
                Your use of certain third-party services may also be subject to
                the applicable provider&apos;s own terms and policies.
              </p>
            </PolicySection>

            <PolicySection title="26. Availability of Services">
              <p>
                We aim to keep Delly&apos;s Matchups available and functioning
                reliably, but we do not guarantee uninterrupted or error-free
                availability.
              </p>

              <p>
                Services may occasionally be unavailable because of
                maintenance, security work, technical failures, third-party
                outages or circumstances outside our reasonable control.
              </p>
            </PolicySection>

            <PolicySection title="27. Account Suspension and Termination">
              <p>
                Accounts or access may be restricted, suspended or terminated
                where users materially violate these Terms, misuse the
                platform, create a safety risk, engage in fraud or abuse, or
                where restriction is reasonably necessary to comply with law.
              </p>

              <p>
                Serious violations may result in immediate action without prior
                warning where reasonably necessary.
              </p>
            </PolicySection>

            <PolicySection title="28. Closing Your Account">
              <p>
                You may request closure or deletion of your account in
                accordance with the procedures described in our{" "}
                <PolicyLink href="/privacy">
                  Privacy Policy
                </PolicyLink>
                .
              </p>

              <p>
                Account closure does not automatically remove obligations,
                payment records or other information that we are legally
                required or reasonably permitted to retain.
              </p>
            </PolicySection>

            <PolicySection title="29. Disclaimer and Limitation of Liability">
              <p>
                Nothing in these Terms excludes or limits liability where it
                would be unlawful to do so.
              </p>

              <p>
                To the extent permitted by law, Delly&apos;s Matchups is not
                responsible for losses arising solely from the independent
                actions, representations or conduct of users outside our
                reasonable control.
              </p>

              <p>
                Delly&apos;s Matchups does not guarantee that use of the
                platform will result in a particular relationship, commercial,
                educational or personal outcome.
              </p>
            </PolicySection>

            <PolicySection title="30. Changes to These Terms">
              <p>
                We may update these Terms from time to time to reflect changes
                to our services, technology, business practices or legal
                requirements.
              </p>

              <p>
                Where material changes are made, we will update the Last
                Updated date and may provide additional notice where
                appropriate.
              </p>

              <p>
                Continued use of the services after updated Terms take effect
                may constitute acceptance of those updated Terms where
                permitted by applicable law.
              </p>
            </PolicySection>

            <PolicySection title="31. Governing Law">
              <p>
                These Terms are governed by the laws of England and Wales,
                subject to any mandatory consumer protections or jurisdictional
                rights that apply to you.
              </p>
            </PolicySection>

            <PolicySection title="32. Severability">
              <p>
                If any provision of these Terms is found to be invalid,
                unlawful or unenforceable, the remaining provisions will
                continue to apply to the extent permitted by law.
              </p>
            </PolicySection>

            <PolicySection title="33. Entire Agreement">
              <p>
                These Terms, together with the Privacy Policy, Cancellation
                &amp; Refund Policy and any additional terms presented for a
                specific product or service, form the applicable agreement
                governing your use of Delly&apos;s Matchups.
              </p>
            </PolicySection>

            <PolicySection title="34. Contact Information">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="font-bold text-white">
                  DELLY&apos;S MATCHUPS LTD
                </p>

                <p className="mt-3">Company Number: 17251701</p>

                <p className="mt-3">
                  General Contact:{" "}
                  <EmailLink email={GENERAL_EMAIL} />
                </p>

                <p className="mt-3">
                  Customer Support:{" "}
                  <EmailLink email={SUPPORT_EMAIL} />
                </p>

                <p className="mt-3">
                  Legal &amp; Privacy:{" "}
                  <EmailLink email={LEGAL_EMAIL} />
                </p>

                <p className="mt-3">
                  Website:{" "}
                  <a
                    href={WEBSITE_URL}
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    www.dellysmatchups.org
                  </a>
                </p>
              </div>
            </PolicySection>

            <PolicySection title="35. Related Policies">
              <div className="flex flex-col gap-4">
                <PolicyLink href="/privacy">
                  Privacy Policy
                </PolicyLink>

                <PolicyLink href="/cancellation-refund-policy">
                  Cancellation &amp; Refund Policy
                </PolicyLink>
              </div>
            </PolicySection>

            <PolicySection title="36. Acceptance of Terms">
              <p>
                By creating an account or using Delly&apos;s Matchups, you
                confirm that you have had an opportunity to review these Terms
                &amp; Conditions and agree to be bound by them.
              </p>
            </PolicySection>

            <div className="mt-16 text-center">
              <a
                href="/auth/signup"
                className="inline-flex rounded-2xl bg-white px-8 py-4 font-bold text-[#b30018] transition hover:scale-105"
              >
                Join Delly&apos;s Matchups
              </a>
            </div>
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
    <ul className="space-y-4 text-white/75">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}

function EmailLink({ email }) {
  return (
    <a
      href={`mailto:${email}`}
      className="font-semibold text-white underline underline-offset-4"
    >
      {email}
    </a>
  );
}

function PolicyLink({ href, children }) {
  return (
    <a
      href={href}
      className="font-semibold text-white underline underline-offset-4 hover:text-red-100"
    >
      {children}
    </a>
  );
}
