"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

const services = {
  premarital: "Premarital Counselling",
  marital: "Marital Counselling",
  "purpose-discovery": "Purpose Discovery",
  "mentoring-coaching": "Mentoring & Coaching",
  healing: "Emotional Healing",
};

function BookingForm() {
  const searchParams = useSearchParams();
  const selectedService = searchParams.get("service") || "premarital";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    service: services[selectedService] || "Premarital Counselling",
    relationshipStatus: "",
    preferredDate: "",
    message: "",
    acceptedTerms: false,
  });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.acceptedTerms) {
      alert("Please accept the terms and conditions before continuing.");
      return;
    }

    const { data, error } = await supabase
      .from("counselling_bookings")
      .insert({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        service: form.service,
        relationship_status: form.relationshipStatus,
        preferred_date: form.preferredDate,
        message: form.message,
        accepted_terms: form.acceptedTerms,
      })
      .select("id");

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = `/counselling/payment?booking=${data[0].id}`;
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-4 pb-24 pt-36 text-white sm:px-6 lg:pt-44">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
              Counselling Booking
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl md:text-8xl">
              Begin Your Healing Journey
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/80">
              Fill this form carefully. Your information will be treated with
              confidentiality, empathy, and respect.
            </p>
          </motion.div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-12 rounded-[2rem] bg-[#c1121f] p-5 shadow-2xl sm:p-8 md:mt-16 md:rounded-[3rem] md:p-12"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="Full name"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Email address"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="Phone number"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                required
                placeholder="Country"
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none placeholder:text-white/60"
              />

              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                required
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
              >
                {Object.values(services).map((service) => (
                  <option key={service} value={service} className="text-black">
                    {service}
                  </option>
                ))}
              </select>

              <select
                name="relationshipStatus"
                value={form.relationshipStatus}
                onChange={handleChange}
                required
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none"
              >
                <option value="" className="text-black">
                  Relationship status
                </option>
                <option className="text-black">Single</option>
                <option className="text-black">Dating</option>
                <option className="text-black">Engaged</option>
                <option className="text-black">Married</option>
                <option className="text-black">Separated</option>
                <option className="text-black">Prefer not to say</option>
              </select>

              <input
                type="date"
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                required
                className="h-16 rounded-2xl border border-white/15 bg-white/10 px-5 text-white outline-none md:col-span-2"
              />

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                placeholder="Briefly describe what you need help with..."
                className="min-h-44 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60 md:col-span-2"
              />
            </div>
            
            <div className="mt-8 max-h-[500px] overflow-y-auto rounded-2xl bg-white/10 p-6 text-sm leading-7 text-white">
  <h3 className="mb-4 text-xl font-bold">
    Counselling Session Terms & Conditions
  </h3>

  <p className="mb-6 font-semibold">
    Delly's Matchups (DMs) & Delly's Mentoring Academy
  </p>

  <p className="mb-6">
    By booking a counselling, mentorship, coaching, or consultation session
    with DMs, you acknowledge that you have read, understood, and agreed to
    the following Terms and Conditions.
  </p>

  <h4 className="mb-2 mt-6 font-bold">
    1. Nature of Counselling Services
  </h4>

  <p>Our counselling and mentorship sessions are designed to provide:</p>

  <ul className="mb-4 ml-6 list-disc">
    <li>Emotional support</li>
    <li>Relationship guidance</li>
    <li>Biblical and practical life counselling</li>
    <li>Mentorship</li>
    <li>Coaching</li>
    <li>Personal development support</li>
  </ul>

  <p>
    These sessions are intended for guidance and educational purposes and do
    not replace licensed psychiatric, medical, legal, or emergency mental
    health services.
  </p>

  <h4 className="mb-2 mt-6 font-bold">2. Session Duration</h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>Standard counselling sessions last for one (1) hour.</li>
    <li>
      Clients requiring extended sessions beyond the scheduled one hour may
      be charged additional fees depending on the extra time requested.
    </li>
    <li>
      Session timing begins at the agreed appointment time regardless of
      late arrival by the client.
    </li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    3. Counselling Categories & Pricing
  </h4>

  <p>Our pricing structure varies depending on:</p>

  <ul className="mb-4 ml-6 list-disc">
    <li>Individual sessions</li>
    <li>Couple sessions</li>
    <li>Geographic location</li>
  </ul>

  <p className="font-semibold">Pricing Guidelines</p>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Clients based in Cameroon and parts of Africa may benefit from
      subsidized rates and generally pay lower fees than international
      clients.
    </li>
    <li>
      Clients residing abroad may be charged international counselling
      rates.
    </li>
    <li>
      Couple counselling sessions are charged at a higher rate than
      individual sessions.
    </li>
  </ul>

  <p>
    Specific pricing details may be communicated privately or published on
    official DMs platforms.
  </p>

  <h4 className="mb-2 mt-6 font-bold">4. Payment Policy</h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Full payment must be made before a counselling session is confirmed.
    </li>
    <li>
      Payments are considered a commitment to the scheduled session time.
    </li>
  </ul>

  <p className="font-semibold">Refund Policy</p>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Payments are strictly non-refundable once a session has been booked
      and confirmed.
    </li>
    <li>Refunds will only be issued where:</li>
    <ul className="ml-6 list-disc">
      <li>The session was not carried out due to fault from DMs.</li>
      <li>The counsellor failed to attend without rescheduling.</li>
      <li>
        Exceptional circumstances determined solely by management.
      </li>
    </ul>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    5. Rescheduling & Cancellation
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Clients are encouraged to notify us early if they are unable to
      attend a session.
    </li>
    <li>
      Rescheduling requests should preferably be made at least 24 hours
      before the scheduled appointment.
    </li>
    <li>
      Repeated cancellations, no-shows, or last-minute changes may result
      in forfeiture of payment.
    </li>
  </ul>

  <p>
    DMs reserves the right to reschedule sessions where necessary due to
    emergencies or unforeseen circumstances.
  </p>

  <h4 className="mb-2 mt-6 font-bold">
    6. Mode of Counselling Sessions
  </h4>

  <p>
    Counselling and mentorship sessions may be conducted through:
  </p>

  <ul className="mb-4 ml-6 list-disc">
    <li>WhatsApp voice calls</li>
    <li>WhatsApp video calls</li>
    <li>Voice notes</li>
    <li>Text-based communication where necessary</li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    7. Follow-Up Sessions
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Follow-up sessions are generally scheduled at least one (1) week
      after the main counselling session.
    </li>
    <li>This allows adequate time for:</li>
    <ul className="ml-6 list-disc">
      <li>Reflection</li>
      <li>Practical implementation</li>
      <li>Emotional processing</li>
      <li>Progress evaluation</li>
    </ul>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    8. Respectful Conduct Policy
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>Disrespect</li>
    <li>Insults</li>
    <li>Harassment</li>
    <li>Threats</li>
    <li>Aggressive behavior</li>
    <li>Bullying</li>
    <li>Any form of abuse directed toward counsellors, staff, or representatives</li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">9. Confidentiality</h4>

  <p>
    All counselling sessions are handled with discretion, professionalism,
    and confidentiality.
  </p>

  <h4 className="mb-2 mt-6 font-bold">
    10. Language of Communication
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>English</li>
    <li>French</li>
    <li>Pidgin English</li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    11. Client Responsibility
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>Counselling is a collaborative process.</li>
    <li>
      Progress requires honesty, accountability, and willingness to
      implement guidance.
    </li>
    <li>
      Outcomes may vary depending on individual commitment and
      circumstances.
    </li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    12. Recording & Privacy
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Clients are not permitted to secretly record counselling sessions
      without prior consent.
    </li>
    <li>
      Counselling materials, conversations, and mentorship content remain
      confidential and protected.
    </li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    13. Online Sessions & Technical Issues
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>
      Clients are responsible for ensuring stable internet access and a
      conducive environment.
    </li>
    <li>
      DMs shall not be held liable for interruptions caused by poor
      connectivity, technical failures, or third-party platform
      disruptions.
    </li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    14. Emotional & Sensitive Discussions
  </h4>

  <ul className="mb-4 ml-6 list-disc">
    <li>Trauma</li>
    <li>Relationships</li>
    <li>Emotional pain</li>
    <li>Marriage</li>
    <li>Family conflicts</li>
    <li>Sexual purity</li>
    <li>Sensitive life experiences</li>
  </ul>

  <h4 className="mb-2 mt-6 font-bold">
    15. Spiritual & Biblical Guidance
  </h4>

  <p>
    As DMs is founded on Biblical principles, aspects of spiritual and
    faith-based guidance may form part of counselling sessions where
    appropriate.
  </p>

  <h4 className="mb-2 mt-6 font-bold">
    16. Acceptance of Terms
  </h4>

  <ul className="ml-6 list-disc">
    <li>Understand these Terms and Conditions.</li>
    <li>Agree to abide by them.</li>
    <li>
      Consent to participate voluntarily in the counselling process.
    </li>
  </ul>

  <p className="mt-8 text-center font-bold">
    Delly's Matchups (DMs)
  </p>

  <p className="text-center italic">
    Redefining Authentic Relationships
  </p>
</div>


            <label className="mt-8 flex gap-4 text-left">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span className="text-sm leading-7 text-white/85">
                I confirm that I have carefully read, understood, and accepted
                the counselling session terms and conditions of Delly’s Matchups
                (DMs).
              </span>
            </label>

            <button
              type="submit"
              className="mt-10 w-full rounded-full bg-white py-5 text-lg font-black text-[#b30018] transition hover:scale-105"
            >
              Submit Booking Request
            </button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

export default function CounsellingBookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          Loading...
        </main>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
