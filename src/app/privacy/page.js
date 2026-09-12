// src/app/privacy/page.js

export const metadata = {
  title: "Privacy Policy | Delly's Matchups",
  description:
    "Privacy Policy for Delly's Matchups website, mobile application, matchmaking, counselling, Academy, shop and related services.",
};

const CONTACT_EMAIL = "info@dellysmatchups.org";
const WEBSITE_URL = "https://www.dellysmatchups.org";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#b30018] px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-xl md:p-14">
        <p className="font-bold uppercase tracking-[0.35em] text-red-100">
          Legal
        </p>

        <h1 className="font-display mt-4 text-5xl font-bold leading-none md:text-7xl">
          Privacy Policy
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
            &quot;Delly&apos;s Matchups&quot;, &quot;we&quot;, &quot;our&quot;
            or &quot;us&quot;).
          </p>

          <p className="leading-8">
            Your privacy is important to us. This Privacy Policy explains how
            Delly&apos;s Matchups Ltd collects, uses, stores, shares and
            protects personal information when you use our website, mobile
            application, matchmaking services, counselling services, Academy
            programmes, shop, communication features and related services.
          </p>

          <p className="leading-8">
            By creating an account or using Delly&apos;s Matchups, you
            acknowledge that you have been given access to this Privacy Policy
            and understand how your personal information may be handled as
            described below.
          </p>
        </div>

        <div className="mt-16 space-y-14">
          <PolicySection title="1. Our Commitment to Privacy">
            <p>
              Delly&apos;s Matchups is committed to protecting the dignity,
              confidentiality and personal information of our users.
            </p>

            <p>
              We aim to handle personal information fairly, lawfully, securely
              and only for legitimate purposes connected with providing,
              protecting and operating our services.
            </p>
          </PolicySection>

          <PolicySection title="2. Who We Are">
            <p>
              Delly&apos;s Matchups Ltd operates the Delly&apos;s Matchups
              platform, including our website, mobile application and related
              services.
            </p>

            <p>
              For privacy questions, data requests or concerns, contact us at{" "}
              <EmailLink />.
            </p>
          </PolicySection>

          <PolicySection title="3. Information We Collect">
            <p>
              The information we collect depends on the services and features
              you use.
            </p>

            <PolicyList
              items={[
                "Full name",
                "Date of birth or age information where required",
                "Email address",
                "Telephone number",
                "Country and city",
                "Account and authentication information",
                "Membership status and plan information",
                "Profile photographs",
                "Profile information and preferences",
                "Matchmaking preferences",
                "Profile visibility settings",
                "Messages, enquiries and matchmaking interactions",
                "Counselling booking information",
                "Academy enrolment and participation information",
                "Shop order and delivery information",
                "Payment and transaction information",
                "Customer support and contact form communications",
                "Technical, device, security and diagnostic information",
              ]}
            />

            <p>
              We may also process other information that you choose to provide
              when using the platform.
            </p>
          </PolicySection>

          <PolicySection title="4. Profile and Matchmaking Information">
            <p>
              To provide matchmaking services, we may process information
              contained in your profile, including photographs, personal
              details, preferences and other information you choose to provide.
            </p>

            <p>
              Certain profile information may be visible to other eligible
              Delly&apos;s Matchups users as part of the matchmaking service.
            </p>

            <p>
              Where profile visibility controls are available, your selected
              settings may determine whether your profile is displayed to
              other users.
            </p>

            <p>
              You should avoid including sensitive information, private
              contact details or information you do not wish to share in
              publicly visible profile fields.
            </p>
          </PolicySection>

          <PolicySection title="5. How We Use Your Information">
            <p>We may use personal information to:</p>

            <PolicyList
              items={[
                "Create and manage user accounts",
                "Verify and authenticate users",
                "Provide matchmaking services",
                "Display and manage user profiles",
                "Manage memberships and access levels",
                "Process counselling bookings",
                "Administer Academy programmes and courses",
                "Process and fulfil shop orders",
                "Process and confirm payments",
                "Provide audio, video or other communication features",
                "Respond to customer support requests",
                "Send service-related communications",
                "Improve platform functionality",
                "Maintain the safety and integrity of the platform",
                "Detect and prevent fraud, abuse and unauthorised access",
                "Investigate complaints and policy violations",
                "Troubleshoot technical issues",
                "Comply with legal and regulatory obligations",
                "Enforce our Terms and Conditions",
              ]}
            />
          </PolicySection>

          <PolicySection title="6. Legal Basis for Processing">
            <p>
              Where UK data protection law applies, we process personal
              information under one or more lawful bases.
            </p>

            <ul className="space-y-4">
              <li>
                • <strong>Contract:</strong> where processing is necessary to
                provide a service you have requested.
              </li>

              <li>
                • <strong>Legitimate interests:</strong> where processing is
                necessary to operate, improve, protect and secure our services,
                provided those interests are not overridden by your applicable
                rights.
              </li>

              <li>
                • <strong>Legal obligations:</strong> where we are required to
                retain, process or disclose information by law.
              </li>

              <li>
                • <strong>Consent:</strong> where consent is required and you
                have provided it.
              </li>
            </ul>

            <p>
              Where we rely on consent, you may withdraw that consent where
              applicable.
            </p>
          </PolicySection>

          <PolicySection title="7. Communication and Messaging">
            <p>
              Delly&apos;s Matchups may provide messaging, contact and
              communication features.
            </p>

            <p>
              We may review communications where reasonably necessary to
              investigate fraud, abuse, harassment, threats, safety concerns
              or violations of our policies.
            </p>

            <p>
              We do not routinely monitor private communications without
              reason, but communications may be investigated where reasonably
              necessary to protect users, protect the platform or comply with
              legal obligations.
            </p>
          </PolicySection>

          <PolicySection title="8. Counselling and Mentorship Information">
            <p>
              Counselling and mentorship information is treated with care and
              confidentiality.
            </p>

            <p>We may process:</p>

            <PolicyList
              items={[
                "Booking information",
                "Contact details",
                "Appointment information",
                "Payment status",
                "Information voluntarily provided in connection with a counselling or mentorship service",
              ]}
            />

            <p>
              Users should avoid submitting unnecessary medical or highly
              sensitive information through general contact forms.
            </p>

            <p>
              Where information relating to personal circumstances or
              wellbeing is provided as part of a counselling or mentorship
              service, we take reasonable steps to restrict access to those who
              reasonably require it to provide or administer the service.
            </p>

            <p>
              Confidentiality may be limited where disclosure is required by
              law or where reasonably necessary to address serious safety
              concerns.
            </p>
          </PolicySection>

          <PolicySection title="9. Academy Information">
            <p>
              Where you participate in Delly&apos;s Matchups Academy, we may
              process information including:
            </p>

            <PolicyList
              items={[
                "Course or programme selections",
                "Enrolment information",
                "Participation or progress information",
                "Payment status",
                "Access status",
              ]}
            />

            <p>
              This information is used to provide and administer Academy
              services.
            </p>
          </PolicySection>

          <PolicySection title="10. Shop and Order Information">
            <p>
              Where you purchase products through Delly&apos;s Matchups, we may
              process:
            </p>

            <PolicyList
              items={[
                "Your name",
                "Email address",
                "Telephone number",
                "Delivery address",
                "City and country",
                "Products purchased",
                "Quantities",
                "Order number",
                "Order history",
                "Payment method",
                "Payment status",
                "Delivery and fulfilment status",
              ]}
            />

            <p>
              This information is used to process, fulfil and support your
              order.
            </p>
          </PolicySection>

          <PolicySection title="11. Payments">
            <p>
              Delly&apos;s Matchups may support online and approved manual
              payment methods.
            </p>

            <p>
              We may process information needed to identify, verify and
              reconcile a payment, including:
            </p>

            <PolicyList
              items={[
                "Payment method",
                "Transaction reference",
                "Payment status",
                "Amount",
                "Related membership, booking, course, order or service",
              ]}
            />

            <p>
              Online payments may be processed by third-party payment providers
              such as PayPal or other authorised payment processors.
            </p>

            <p>
              Where a third-party payment provider processes a transaction, its
              own privacy policy and terms may also apply.
            </p>

            <p>
              Delly&apos;s Matchups does not require users to provide full
              payment-card credentials directly to us where those details are
              processed securely by a payment provider.
            </p>
          </PolicySection>

          <PolicySection title="12. Audio and Video Calls">
            <p>
              Delly&apos;s Matchups may provide audio or video calling
              functionality.
            </p>

            <p>
              Technical information necessary to establish, operate and secure
              these communications may be processed by our communications
              technology providers.
            </p>

            <p>
              We do not state that calls are recorded unless participants are
              expressly informed that recording is taking place.
            </p>
          </PolicySection>

          <PolicySection title="13. Cookies and Tracking Technologies">
            <p>
              Our website may use cookies and similar technologies where
              necessary for:
            </p>

            <PolicyList
              items={[
                "Authentication",
                "Security",
                "Session management",
                "Platform functionality",
                "Analytics",
                "Performance improvement",
              ]}
            />

            <p>
              Where required by law, appropriate consent will be requested for
              non-essential cookies or similar technologies.
            </p>
          </PolicySection>

          <PolicySection title="14. Technical and Security Information">
            <p>
              When you access Delly&apos;s Matchups, we and our service
              providers may process technical information such as:
            </p>

            <PolicyList
              items={[
                "IP address",
                "Device information",
                "Operating system",
                "Browser information",
                "Session information",
                "Application logs",
                "Timestamps",
                "Security events",
                "Diagnostic information",
              ]}
            />

            <p>
              This information may be used to maintain security, prevent abuse,
              troubleshoot problems and improve the reliability of our
              services.
            </p>
          </PolicySection>

          <PolicySection title="15. How We Share Information">
            <p>Delly&apos;s Matchups does not sell personal information.</p>

            <p>
              We may share information where necessary with trusted service
              providers used to operate the platform.
            </p>

            <p>These may include providers of:</p>

            <PolicyList
              items={[
                "Authentication",
                "Database services",
                "Cloud hosting",
                "File storage",
                "Email delivery",
                "Payment processing",
                "Audio and video communications",
                "Security and technical infrastructure",
              ]}
            />

            <p>
              Depending on the services being used, our technology providers
              may include Supabase, Vercel, PayPal, Resend and Stream.
            </p>

            <p>
              These providers may process information on our behalf or under
              their own applicable privacy terms.
            </p>

            <p>
              We may also disclose information where required by law, court
              order or lawful authority, or where reasonably necessary to:
            </p>

            <PolicyList
              items={[
                "Protect users",
                "Investigate fraud or abuse",
                "Address threats or safety concerns",
                "Protect our legal rights",
                "Establish, exercise or defend legal claims",
              ]}
            />
          </PolicySection>

          <PolicySection title="16. User Safety and Protection">
            <p>
              Users are encouraged to exercise caution when interacting with
              people online.
            </p>

            <p>
              Users should not send money directly to strangers or share
              sensitive financial information with other users.
            </p>

            <p>
              Delly&apos;s Matchups may take action against accounts that engage
              in fraud, harassment, threats, abuse or other conduct that
              violates our rules or places others at risk.
            </p>
          </PolicySection>

          <PolicySection title="17. Data Retention">
            <p>
              We retain personal information only for as long as reasonably
              necessary for the purposes for which it was collected.
            </p>

            <p>
              Different categories of information may be retained for different
              periods.
            </p>

            <p>We may retain certain information where necessary for:</p>

            <PolicyList
              items={[
                "Legal obligations",
                "Accounting requirements",
                "Payment records",
                "Fraud prevention",
                "Safety investigations",
                "Disputes",
                "Enforcement of our agreements",
              ]}
            />

            <p>
              Information may remain temporarily in secure backups after
              deletion from active systems.
            </p>
          </PolicySection>

          <PolicySection title="18. Account and Data Deletion">
            <p>
              Users may request deletion of their Delly&apos;s Matchups account
              and associated personal information.
            </p>

            <p>
              Requests can be sent to <EmailLink /> using the email address
              associated with the account.
            </p>

            <p>
              We may need to verify your identity before processing an account
              or data deletion request.
            </p>

            <p>
              Certain information may need to be retained where required for
              legal, security, payment, accounting, fraud-prevention or
              dispute-resolution purposes.
            </p>
          </PolicySection>

          <PolicySection title="19. Your Data Protection Rights">
            <p>
              Depending on applicable law and your circumstances, you may have
              the right to:
            </p>

            <PolicyList
              items={[
                "Request access to personal information we hold about you",
                "Request correction of inaccurate information",
                "Request deletion of personal information",
                "Request restriction of certain processing",
                "Object to certain processing",
                "Request eligible information in a portable format",
                "Withdraw consent where processing relies on consent",
              ]}
            />

            <p>
              To exercise these rights, contact <EmailLink />.
            </p>

            <p>
              Where applicable, you may also have the right to complain to the
              UK Information Commissioner&apos;s Office or another relevant
              supervisory authority.
            </p>
          </PolicySection>

          <PolicySection title="20. Children’s Privacy and Age Restrictions">
            <p>
              Delly&apos;s Matchups matchmaking services are intended for
              individuals aged 18 years and over.
            </p>

            <p>
              We do not knowingly provide adult matchmaking services to
              children.
            </p>

            <p>
              If we become aware that personal information relating to a child
              has been collected in circumstances where it should not have been,
              we will take appropriate steps to investigate and, where
              required, delete it.
            </p>
          </PolicySection>

          <PolicySection title="21. International Data Transfers">
            <p>
              Some technology providers used by Delly&apos;s Matchups may
              process personal information outside the United Kingdom.
            </p>

            <p>
              Where required by applicable data protection law, appropriate
              safeguards will be used for international transfers of personal
              information.
            </p>
          </PolicySection>

          <PolicySection title="22. Third-Party Links and Services">
            <p>
              Our website or mobile application may contain links to third-party
              websites or services that we do not control.
            </p>

            <p>
              Delly&apos;s Matchups is not responsible for the privacy
              practices, content or security of third-party services.
            </p>

            <p>
              Users should review the privacy policies of those services before
              providing personal information to them.
            </p>
          </PolicySection>

          <PolicySection title="23. Data Security">
            <p>
              We implement reasonable technical and organisational measures
              designed to protect personal information from unauthorised access,
              misuse, disclosure, alteration, loss or destruction.
            </p>

            <p>
              However, no internet-based platform can guarantee absolute
              security.
            </p>

            <p>
              Users are responsible for protecting their account credentials and
              should notify us if they suspect unauthorised access to their
              account.
            </p>
          </PolicySection>

          <PolicySection title="24. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes to our services, technology, business practices or legal
              obligations.
            </p>

            <p>
              Where material changes are made, we will update the Last Updated
              date above and may provide additional notice where appropriate.
            </p>
          </PolicySection>

          <PolicySection title="25. Contact Information">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <p className="font-bold text-white">
                Delly&apos;s Matchups Ltd
              </p>

              <p className="mt-3">
                Email: <EmailLink />
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

          <PolicySection title="26. Acknowledgement">
            <p>
              By creating an account or using Delly&apos;s Matchups, you confirm
              that you have been given access to this Privacy Policy and
              understand how your personal information may be handled as
              described above.
            </p>
          </PolicySection>
        </div>
      </div>
    </main>
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

function EmailLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-white underline underline-offset-4"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
