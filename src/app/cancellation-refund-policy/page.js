// src/app/cancellation-refund-policy/page.js

export const metadata = {
    title: "Cancellation & Refund Policy | Delly's Matchups",
    description:
      "Cancellation and refund terms for Delly's Matchups memberships, matchmaking, counselling, mentorship, Academy courses and shop purchases.",
  };
  
  const SUPPORT_EMAIL = "support@dellysmatchups.org";
  const WEBSITE_URL = "https://www.dellysmatchups.org";
  
  export default function CancellationRefundPolicyPage() {
    return (
      <main className="min-h-screen bg-[#b30018] px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-xl md:p-14">
          <p className="font-bold uppercase tracking-[0.35em] text-red-100">
            Legal
          </p>
  
          <h1 className="font-display mt-4 text-5xl font-bold leading-none md:text-7xl">
            Cancellation &amp; Refund Policy
          </h1>
  
          <div className="mt-8 space-y-6 leading-8 text-white/75">
            <p>
              <strong>Effective Date:</strong> 12 September 2026
            </p>
  
            <p>
              <strong>Last Updated:</strong> 12 September 2026
            </p>
  
            <p>
              Delly&apos;s Matchups Ltd (&quot;Delly&apos;s Matchups&quot;,
              &quot;we&quot;, &quot;our&quot; or &quot;us&quot;) provides both
              free and paid services through our website and mobile application.
            </p>
  
            <p>
              A free account is required to access and navigate the
              Delly&apos;s Matchups platform. Free members may access selected
              features and content, including articles, blogs and other areas
              made available to free account holders.
            </p>
  
            <p>
              Additional services require payment. These may include paid
              memberships, matchmaking, counselling, mentorship, Delly&apos;s
              Matchups Academy courses and programmes, and products purchased
              through our shop.
            </p>
  
            <p>
              This policy explains how cancellations, rescheduling and refunds
              are handled for those paid services and products.
            </p>
  
            <p>
              Nothing in this policy excludes or limits any statutory consumer
              rights that cannot legally be excluded or limited.
            </p>
          </div>
  
          <div className="mt-16 space-y-14">
            <PolicySection title="1. Paid Memberships and Subscriptions">
              <p>
                Delly&apos;s Matchups may offer Premium, VIP or other paid
                membership and subscription plans.
              </p>
  
              <p>
                Once a paid membership period has started and the applicable
                benefits or paid features have been made available, the payment
                is generally non-refundable for that period, except where a
                refund is required by applicable law.
              </p>
  
              <p>
                You may cancel a recurring subscription to prevent future
                renewal charges. Cancelling does not normally reverse payment
                for a billing period that has already started.
              </p>
  
              <p>
                Where applicable, your paid benefits may remain available until
                the end of the period you have already paid for.
              </p>
  
              <p>
                If a subscription is purchased through an app store or another
                third-party billing provider, that provider&apos;s applicable
                billing and refund procedures may also apply.
              </p>
            </PolicySection>
  
            <PolicySection title="2. Matchmaking Services">
              <p>
                Matchmaking is a paid service and may involve profile review,
                assessment, screening, administrative work, searches for
                potentially compatible individuals, communication with
                prospective matches and arranging introductions.
              </p>
  
              <p>
                If you ask to cancel before matchmaking work has commenced, we
                will assess the request according to the circumstances and your
                applicable consumer rights.
              </p>
  
              <p>
                Once Delly&apos;s Matchups has begun reviewing, screening,
                assessing, searching for potential matches, contacting
                prospective matches or otherwise carrying out matchmaking work
                for you, the service is considered to have commenced.
              </p>
  
              <p>
                Amounts relating to services already supplied or work already
                carried out are ordinarily non-refundable, except where
                applicable law requires otherwise.
              </p>
  
              <p>
                No refund will ordinarily be provided simply because:
              </p>
  
              <ul className="list-disc space-y-2 pl-6">
                <li>you do not wish to pursue the person introduced;</li>
                <li>the other person does not wish to pursue you;</li>
                <li>communication between you does not progress;</li>
                <li>either person loses interest;</li>
                <li>a relationship subsequently ends; or</li>
                <li>
                  the introduction does not result in dating, engagement or
                  marriage.
                </li>
              </ul>
  
              <p>
                Delly&apos;s Matchups provides a matchmaking service. We do not
                guarantee that an introduction will result in a relationship,
                engagement or marriage.
              </p>
            </PolicySection>
  
            <PolicySection title="3. Counselling Bookings">
              <p>
                Counselling appointments provided through Delly&apos;s Matchups
                are paid services.
              </p>
  
              <p>
                Clients should provide at least 24 hours&apos; notice where
                possible if they need to cancel or reschedule an appointment.
              </p>
  
              <p>
                Where sufficient notice is provided, we may offer a reasonable
                opportunity to reschedule the appointment. Providing notice does
                not automatically create an entitlement to a cash refund.
              </p>
  
              <p>
                A counselling payment may ordinarily be treated as used where
                the session has already taken place, the session has commenced,
                the client fails to attend, or a late cancellation means the
                reserved professional time cannot reasonably be reallocated.
              </p>
  
              <p>
                If Delly&apos;s Matchups is unable to provide a booked
                counselling session, we will normally attempt to arrange a
                suitable replacement. If we cannot reasonably provide the
                service, an appropriate refund or other remedy may be offered.
              </p>
            </PolicySection>
  
            <PolicySection title="4. Mentorship Services">
              <p>
                Mentorship sessions, programmes and packages are paid services.
              </p>
  
              <p>
                Clients should give reasonable notice if they need to cancel or
                reschedule a future mentorship session.
              </p>
  
              <p>
                Once a mentorship session or programme has commenced, amounts
                relating to preparation, professional time, sessions, programme
                access or support already supplied are ordinarily
                non-refundable.
              </p>
  
              <p>
                A missed appointment or late cancellation may be treated as a
                used session where professional time has already been reserved
                and cannot reasonably be reallocated.
              </p>
            </PolicySection>
  
            <PolicySection title="5. Delly’s Matchups Academy">
              <p>
                Users may read information about Academy courses, modules and
                programmes before deciding whether to enrol.
              </p>
  
              <p>
                Reading course descriptions does not provide access to the paid
                course itself. Enrolment and access to paid lessons, modules,
                programmes or other premium Academy content require payment
                unless expressly stated otherwise.
              </p>
  
              <p>
                Where a course or programme has already commenced, amounts
                relating to content, tuition, sessions or services already
                supplied are ordinarily non-refundable, except where applicable
                law requires otherwise.
              </p>
  
              <p>
                Choosing not to continue or complete a course after access or
                delivery has begun does not by itself create an entitlement to a
                refund.
              </p>
            </PolicySection>
  
            <PolicySection title="6. Digital Content and Immediate Access">
              <p>
                Some Academy courses or other paid services may include digital
                lessons, videos, recordings, downloads, documents or other
                online content.
              </p>
  
              <p>
                Where you request immediate access to qualifying digital content
                before the end of an applicable statutory cancellation period,
                we may ask you to expressly agree to immediate supply and
                acknowledge any effect this has on your cancellation rights.
              </p>
  
              <p>
                Once digital content has been supplied following any consent and
                acknowledgement required by law, cancellation rights may be
                limited to the extent permitted by applicable law.
              </p>
  
              <p>
                This does not affect statutory rights where digital content is
                faulty, materially misdescribed or not supplied as agreed.
              </p>
            </PolicySection>
  
            <PolicySection title="7. No-Shows and Failure to Participate">
              <p>
                Paid services may reserve appointment time, professional time or
                a limited programme place specifically for you.
              </p>
  
              <p>
                Failure to attend a scheduled appointment, repeated failure to
                respond, failure to provide information reasonably required to
                deliver the service, or abandonment of a programme after it has
                commenced does not ordinarily create an entitlement to a refund
                for work or services already provided.
              </p>
  
              <p>
                We may consider genuine exceptional circumstances on a
                case-by-case basis.
              </p>
            </PolicySection>
  
            <PolicySection title="8. Misrepresentation, Abuse and Breach of Terms">
              <p>
                Delly&apos;s Matchups may suspend, restrict or terminate an
                account or service where a user materially breaches our Terms
                &amp; Conditions.
              </p>
  
              <p>This may include circumstances involving:</p>
  
              <ul className="list-disc space-y-2 pl-6">
                <li>false or deliberately misleading information;</li>
                <li>misrepresentation of marital or relationship status;</li>
                <li>fraud, scams or financial solicitation;</li>
                <li>abusive, threatening or harassing behaviour;</li>
                <li>prohibited or inappropriate content; or</li>
                <li>serious misuse of the Delly&apos;s Matchups platform.</li>
              </ul>
  
              <p>
                Where termination results from a serious breach by the user,
                amounts relating to services already supplied, professional time
                already used or work already performed are ordinarily
                non-refundable, subject to applicable law.
              </p>
            </PolicySection>
  
            <PolicySection title="9. Physical Shop Purchases">
              <p>
                Physical products purchased through the Delly&apos;s Matchups
                shop are subject to applicable consumer cancellation, return and
                refund rights.
              </p>
  
              <p>
                Where a statutory cancellation right applies to an eligible
                online purchase, the applicable cancellation and return period
                will be honoured.
              </p>
  
              <p>
                Returned goods should be kept in reasonable condition. Where
                permitted by law, a refund may be reduced if the value of the
                goods has been diminished by handling beyond what was reasonably
                necessary to inspect them.
              </p>
  
              <p>
                Some goods may be excluded from change-of-mind cancellation
                rights where a lawful exemption applies, including certain
                personalised or custom-made items.
              </p>
  
              <p>
                If goods are faulty, damaged, materially misdescribed or
                incorrect, contact us promptly so that we can investigate and
                provide the appropriate remedy.
              </p>
            </PolicySection>
  
            <PolicySection title="10. Cancellation by Delly’s Matchups">
              <p>
                Where Delly&apos;s Matchups is unable to provide a paid service
                for reasons attributable to us, we will assess the circumstances
                and provide an appropriate remedy.
              </p>
  
              <p>
                Depending on the circumstances, this may include rescheduling,
                replacement service, account credit, an extension of access, a
                partial refund or a full refund.
              </p>
            </PolicySection>
  
            <PolicySection title="11. Duplicate or Incorrect Payments">
              <p>
                If you believe you were charged twice, charged an incorrect
                amount or charged for a purchase you did not authorise, contact
                us promptly so that we can investigate.
              </p>
  
              <p>
                Where an incorrect payment is confirmed, we will take
                appropriate steps to correct it.
              </p>
            </PolicySection>
  
            <PolicySection title="12. Refund Processing">
              <p>
                Where a refund is approved, we will normally return it using the
                original payment method where reasonably possible.
              </p>
  
              <p>
                Payments handled through PayPal, app stores, card processors or
                other third-party providers may also be subject to those
                providers&apos; processing procedures and timescales.
              </p>
  
              <p>
                Banks and payment providers may require additional processing
                time after a refund has been issued by Delly&apos;s Matchups.
              </p>
            </PolicySection>
  
            <PolicySection title="13. Statutory Consumer Rights">
              <p>
                Nothing in this policy removes or reduces statutory consumer
                rights that cannot legally be excluded.
              </p>
  
              <p>
                Where applicable law gives you a cancellation right for an
                online purchase, that right will continue to apply.
              </p>
  
              <p>
                Where you expressly request that a paid service begins during an
                applicable statutory cancellation period, work may begin
                following that request.
              </p>
  
              <p>
                If you subsequently exercise a lawful cancellation right after
                performance has begun, amounts relating to services already
                supplied may be taken into account where permitted by applicable
                law.
              </p>
  
              <p>
                If any provision of this policy conflicts with a statutory right
                that cannot legally be excluded, the statutory right will take
                priority.
              </p>
            </PolicySection>
  
            <PolicySection title="14. How to Request a Cancellation or Refund">
              <p>
                To request a cancellation, rescheduling, return or refund,
                contact Delly&apos;s Matchups using the details below.
              </p>
  
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="font-bold text-white">
                  Delly&apos;s Matchups Ltd
                </p>
  
                <p className="mt-3">
                  Support: <SupportEmailLink />
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
  
              <p>
                Please provide enough information for us to identify the
                relevant account, booking, membership, programme, order or
                transaction.
              </p>
  
              <p>
                This may include your name, account email, booking or order
                reference, payment reference and a short explanation of your
                request.
              </p>
  
              <p>
                Submitting a request does not automatically mean that a refund
                will be approved. Requests will be assessed according to the
                product or service purchased, what has already been supplied and
                any applicable legal requirements.
              </p>
            </PolicySection>
  
            <PolicySection title="15. Changes to This Policy">
              <p>
                We may update this Cancellation &amp; Refund Policy when our
                services, products, payment methods or legal requirements change.
              </p>
  
              <p>
                Where material changes are made, the Last Updated date at the top
                of this page will be revised.
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
        <div className="mt-5 space-y-5 leading-8 text-white/75">{children}</div>
      </section>
    );
  }
  
  function SupportEmailLink() {
    return (
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="font-semibold text-white underline underline-offset-4"
      >
        {SUPPORT_EMAIL}
      </a>
    );
  }
  