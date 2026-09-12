// src/app/cancellation-refund-policy/page.js

export const metadata = {
    title: "Cancellation & Refund Policy | Delly's Matchups",
    description:
      "Cancellation and Refund Policy for Delly's Matchups counselling, memberships, Academy, shop purchases and related services.",
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
  
          <div className="mt-8 space-y-6 text-white/75">
            <p>
              <strong>Effective Date:</strong> 12 September 2026
            </p>
  
            <p>
              <strong>Last Updated:</strong> 12 September 2026
            </p>
  
            <p className="leading-8">
              This Cancellation &amp; Refund Policy explains the rules that
              apply when cancelling, rescheduling or requesting a refund for
              services or products provided by Delly&apos;s Matchups Ltd
              (&quot;Delly&apos;s Matchups&quot;, &quot;DMs&quot;,
              &quot;we&quot;, &quot;our&quot; or &quot;us&quot;).
            </p>
  
            <p className="leading-8">
              Different rules may apply depending on whether you have purchased
              a counselling session, membership, Academy programme, digital
              content or physical product.
            </p>
  
            <p className="leading-8">
              Nothing in this policy is intended to exclude or restrict any
              rights that cannot legally be excluded under applicable consumer
              law.
            </p>
          </div>
  
          <div className="mt-16 space-y-14">
            <PolicySection title="1. General Principles">
              <p>
                We aim to provide clear and fair cancellation and refund terms
                for the products and services offered through Delly&apos;s
                Matchups.
              </p>
  
              <p>
                Where a payment reserves a specific appointment, place,
                programme or period of access, that payment may become
                non-refundable once the booking or service has been confirmed,
                subject to this policy and applicable consumer law.
              </p>
  
              <p>
                Refund eligibility depends on the type of product or service,
                whether the service has begun or been provided, and the reason
                for cancellation.
              </p>
            </PolicySection>
  
            <PolicySection title="2. Counselling Bookings">
              <p>
                Payment secures your counselling appointment and is generally
                non-refundable once the booking has been confirmed.
              </p>
  
              <p>
                A refund will normally be provided where Delly&apos;s Matchups
                is unable to deliver the booked counselling session and an
                appropriate replacement session cannot be agreed.
              </p>
  
              <p>
                Clients should, where possible, provide at least 24 hours&apos;
                notice if they need to cancel or reschedule an appointment.
              </p>
  
              <p>
                Providing notice does not automatically create an entitlement to
                a cash refund. Where appropriate, Delly&apos;s Matchups may
                instead offer a reasonable opportunity to reschedule the
                appointment.
              </p>
            </PolicySection>
  
            <PolicySection title="3. Late Cancellations and No-Shows">
              <p>
                Repeated cancellations, failure to attend a booked session, or
                last-minute changes may result in the payment for that
                appointment being forfeited.
              </p>
  
              <p>
                Where payment is forfeited, a new payment may be required before
                another counselling appointment can be booked.
              </p>
  
              <p>
                We may consider exceptional circumstances individually where it
                is reasonable to do so.
              </p>
            </PolicySection>
  
            <PolicySection title="4. Rescheduling by Delly’s Matchups">
              <p>
                Delly&apos;s Matchups may need to reschedule a counselling
                session because of an emergency, illness, technical problem or
                another circumstance outside our reasonable control.
              </p>
  
              <p>
                Where this happens, we will make reasonable efforts to offer an
                alternative appointment.
              </p>
  
              <p>
                If Delly&apos;s Matchups is unable to provide the booked service
                and a suitable replacement appointment cannot be agreed, the
                affected payment may be refunded.
              </p>
            </PolicySection>
  
            <PolicySection title="5. Abusive, Threatening or Unsafe Behaviour">
              <p>
                Delly&apos;s Matchups reserves the right to refuse, terminate or
                cancel a counselling session where a client behaves in a
                disrespectful, abusive, threatening, harassing or unsafe manner.
              </p>
  
              <p>
                Where a session is terminated or cancelled because of such
                behaviour, the payment may be non-refundable.
              </p>
  
              <p>
                We may also restrict or refuse future bookings where reasonably
                necessary to protect staff, counsellors, mentors, users or other
                persons.
              </p>
            </PolicySection>
  
            <PolicySection title="6. Memberships and Subscriptions">
              <p>
                Where Delly&apos;s Matchups offers a recurring membership or
                subscription, cancellation normally prevents future renewals.
              </p>
  
              <p>
                Unless otherwise stated at the time of purchase, cancelling a
                membership does not normally create an automatic refund for a
                billing period that has already begun.
              </p>
  
              <p>
                Where technically available and permitted by the applicable
                purchase terms, membership benefits may continue until the end
                of the period that has already been paid for.
              </p>
  
              <p>
                Refunds may be considered where Delly&apos;s Matchups has failed
                to provide the purchased membership service, where a payment has
                been taken incorrectly, or where a refund is otherwise required
                by applicable law.
              </p>
  
              <p>
                Where a membership or subscription is purchased through an app
                store or another third-party billing provider, cancellation and
                refund requests may also be subject to that provider&apos;s
                billing and refund procedures.
              </p>
            </PolicySection>
  
            <PolicySection title="7. Academy Programmes and Courses">
              <p>
                Cancellation rights for Delly&apos;s Matchups Academy may depend
                on whether the programme has started and whether access to
                digital materials, lessons or other content has already been
                provided.
              </p>
  
              <p>
                If Delly&apos;s Matchups cancels a paid programme or is unable
                to provide the purchased service, we may offer a replacement,
                alternative date, account credit or refund as appropriate.
              </p>
  
              <p>
                Where a customer requests immediate access to digital content or
                services, statutory cancellation rights may be affected once the
                supply of that content or service begins, where permitted by
                applicable law and where the legally required acknowledgement or
                consent has been obtained.
              </p>
  
              <p>
                Any programme-specific cancellation terms displayed before
                purchase should be read together with this policy.
              </p>
            </PolicySection>
  
            <PolicySection title="8. Digital Content">
              <p>
                Certain Delly&apos;s Matchups products or services may include
                digital content, online materials, recordings, downloads or
                immediate digital access.
              </p>
  
              <p>
                Where digital content is supplied immediately at the
                customer&apos;s request, cancellation or refund rights may be
                limited after access or supply has begun, to the extent permitted
                by applicable law.
              </p>
  
              <p>
                This does not affect rights relating to digital content that is
                faulty, materially misdescribed or not supplied as agreed.
              </p>
            </PolicySection>
  
            <PolicySection title="9. Physical Shop Purchases">
              <p>
                Different cancellation and return rules apply to physical goods
                purchased through the Delly&apos;s Matchups shop.
              </p>
  
              <p>
                Where applicable under UK consumer law, consumers purchasing
                goods online may have a right to cancel an eligible order within
                14 days after receiving the goods.
              </p>
  
              <p>
                After notifying us of a valid cancellation, the goods should be
                returned within the applicable return period and should be kept
                in reasonable condition while in your possession.
              </p>
  
              <p>
                We may make a deduction from a refund where permitted by law if
                the value of returned goods has been reduced because they have
                been handled beyond what is reasonably necessary to inspect
                them.
              </p>
  
              <p>
                Certain products may be excluded from cancellation rights where
                an exclusion is permitted by law, including certain personalised
                products or other exempt goods.
              </p>
            </PolicySection>
  
            <PolicySection title="10. Faulty, Damaged or Incorrect Goods">
              <p>
                If an item arrives faulty, damaged, materially misdescribed or
                different from the item ordered, contact us as soon as reasonably
                possible.
              </p>
  
              <p>
                We may ask for relevant information or photographs so that we
                can investigate the issue.
              </p>
  
              <p>
                Where required, we may provide an appropriate repair,
                replacement, refund or other remedy in accordance with
                applicable consumer law.
              </p>
  
              <p>
                Your statutory rights in relation to faulty or misdescribed
                goods are not affected by this policy.
              </p>
            </PolicySection>
  
            <PolicySection title="11. Return Delivery Costs">
              <p>
                Where a customer changes their mind about an eligible physical
                product, the customer may be responsible for the reasonable cost
                of returning the product unless Delly&apos;s Matchups states
                otherwise.
              </p>
  
              <p>
                Where goods are faulty, damaged, incorrect or otherwise require
                a remedy for which Delly&apos;s Matchups is responsible, return
                costs will be handled in accordance with applicable law.
              </p>
            </PolicySection>
  
            <PolicySection title="12. Payment Methods and Refund Processing">
              <p>
                Where a refund is approved, we will normally attempt to return
                the money using the original payment method where reasonably
                possible.
              </p>
  
              <p>
                Payments processed through PayPal, card processors, app stores
                or other third-party providers may also be subject to the
                provider&apos;s processing procedures and timescales.
              </p>
  
              <p>
                For approved refunds relating to manual payments, we may request
                reasonable payment details needed to return the funds securely.
              </p>
  
              <p>
                A refund may take additional time to appear after it has been
                issued because banks and payment providers control their own
                processing times.
              </p>
            </PolicySection>
  
            <PolicySection title="13. Duplicate or Incorrect Payments">
              <p>
                If you believe you have been charged twice, charged the wrong
                amount or charged for a purchase you did not intend to make,
                contact us promptly so that we can investigate.
              </p>
  
              <p>
                Where an incorrect payment is confirmed, we will take
                appropriate steps to correct it.
              </p>
            </PolicySection>
  
            <PolicySection title="14. Promotional Offers and Discounts">
              <p>
                Refunds relating to discounted purchases, promotional offers or
                vouchers will normally be based on the amount actually paid
                rather than the undiscounted value of the product or service.
              </p>
  
              <p>
                Additional promotional terms may apply where they are clearly
                disclosed before purchase.
              </p>
            </PolicySection>
  
            <PolicySection title="15. Exceptional Circumstances">
              <p>
                Delly&apos;s Matchups may consider exceptional circumstances on
                a case-by-case basis.
              </p>
  
              <p>
                Agreeing to make an exception in one case does not create an
                obligation to make the same exception in another case.
              </p>
            </PolicySection>
  
            <PolicySection title="16. Chargebacks and Payment Disputes">
              <p>
                If you believe a payment is incorrect, we encourage you to
                contact us first so that we have an opportunity to investigate
                and resolve the issue.
              </p>
  
              <p>
                Fraudulent, abusive or knowingly false payment disputes may
                result in restrictions being placed on an account where
                reasonably necessary to protect Delly&apos;s Matchups and its
                users.
              </p>
            </PolicySection>
  
            <PolicySection title="17. Statutory Consumer Rights">
              <p>
                This policy does not remove or reduce any statutory rights you
                may have under applicable consumer protection law.
              </p>
  
              <p>
                Where a provision of this policy conflicts with a legal right
                that cannot be excluded or limited, the applicable legal right
                will take priority.
              </p>
            </PolicySection>
  
            <PolicySection title="18. How to Request a Cancellation or Refund">
              <p>
                To request a cancellation, rescheduling, return or refund,
                contact:
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
                Please include enough information for us to identify the
                relevant booking, order, membership or transaction.
              </p>
  
              <p>
                Where applicable, this may include your name, account email,
                booking or order reference and a brief explanation of the
                request.
              </p>
            </PolicySection>
  
            <PolicySection title="19. Changes to This Policy">
              <p>
                We may update this Cancellation &amp; Refund Policy from time to
                time to reflect changes to our products, services, payment
                methods or legal requirements.
              </p>
  
              <p>
                Where material changes are made, the Last Updated date above
                will be revised.
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
  