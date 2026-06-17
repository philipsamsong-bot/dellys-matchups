"use client";

import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("contact_messages").insert([
      {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      },
    ]);

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    await fetch("/api/send-contact-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      }),
    });

    setLoading(false);
    setSuccess(true);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  }

  return (
    <>
      <SiteNav />

      <main className="bg-[#b30018] text-white">
        <section className="px-6 pb-28 pt-44">
          <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-3">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full lg:col-span-1"
            >
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Contact DMs
              </p>

              <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
                Let’s Talk.
              </h1>

              <p className="mt-8 text-xl leading-10 text-white/85">
                Whether you are seeking counselling, mentorship, emotional
                healing, relationship guidance, or simply need clarity and
                support, we are here to walk the journey with you.
              </p>

              <p className="mt-6 text-lg leading-9 text-white/80">
                Every conversation is handled with confidentiality, empathy,
                wisdom, and genuine care.
              </p>

              <div className="mt-12 space-y-6">
                <a
                  href="mailto:infodellysmatchups@gmail.com"
                  className="flex w-full items-center gap-4 rounded-[2rem] bg-white p-5 text-[#b30018] shadow-2xl transition hover:scale-[1.02] sm:gap-5 sm:p-6"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#b30018] text-2xl text-white">
                    <FaEnvelope />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.35em]">
                      Email
                    </p>
                    <p className="mt-1 break-words text-sm font-bold sm:text-base md:text-lg">
                      infodellysmatchups@gmail.com
                    </p>
                  </div>
                </a>

                <a
                  href="https://wa.me/237676257187"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-4 rounded-[2rem] bg-[#25D366] p-5 text-white shadow-2xl transition hover:scale-[1.02] sm:gap-5 sm:p-6"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl text-[#25D366]">
                    <FaWhatsapp />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.35em]">
                      WhatsApp
                    </p>
                    <p className="mt-1 break-words text-base font-bold md:text-lg">
                      +237 676 257 187
                    </p>
                  </div>
                </a>

                <a
                  href="https://facebook.com/dellysmatchupsre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-4 rounded-[2rem] bg-[#1877F2] p-5 text-white shadow-2xl transition hover:scale-[1.02] sm:gap-5 sm:p-6"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl text-[#1877F2]">
                    <FaFacebookF />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.35em]">
                      Facebook
                    </p>
                    <p className="mt-1 break-words text-base font-bold md:text-lg">
                      @dellysmatchupsre
                    </p>
                  </div>
                </a>

                <a
                  href="https://instagram.com/dellysmatchups"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-4 rounded-[2rem] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-5 text-white shadow-2xl transition hover:scale-[1.02] sm:gap-5 sm:p-6"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl text-pink-600">
                    <FaInstagram />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.35em]">
                      Instagram
                    </p>
                    <p className="mt-1 break-words text-base font-bold md:text-lg">
                      @dellysmatchups
                    </p>
                  </div>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="lg:col-span-2"
            >
              <div className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-14">
                <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                  Send A Message
                </p>

                <h2 className="mt-5 font-serif text-5xl font-black leading-none">
                  Reach Out To Us
                </h2>

                <form onSubmit={handleSubmit} className="mt-12 grid gap-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          full_name: event.target.value,
                        })
                      }
                      className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
                      required
                    />

                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          email: event.target.value,
                        })
                      }
                      className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
                      required
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          phone: event.target.value,
                        })
                      }
                      className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
                    />

                    <input
                      type="text"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          subject: event.target.value,
                        })
                      }
                      className="h-16 rounded-2xl border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
                      required
                    />
                  </div>

                  <textarea
                    placeholder="Your Message"
                    rows={8}
                    value={formData.message}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        message: event.target.value,
                      })
                    }
                    className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white outline-none placeholder:text-white/50"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-16 rounded-full bg-white text-lg font-black text-[#b30018] transition hover:scale-[1.02]"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </button>

                  {success && (
                    <div className="rounded-2xl bg-white p-5 text-lg font-bold text-[#b30018]">
                      Your message has been sent successfully.
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-white p-8 text-[#b30018] shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em]">
              Need Guidance?
            </p>

            <h2 className="mt-6 font-serif text-4xl font-black leading-tight md:text-7xl">
              Healing begins with one conversation.
            </h2>

            <p className="mt-8 max-w-4xl text-lg leading-9 text-black/70 md:text-xl md:leading-10">
              Whether you are preparing for marriage, navigating relationship
              challenges, healing emotionally, seeking purpose, or looking for
              mentorship and accountability, DMs is here to support your
              journey.
            </p>

            <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:flex-wrap">
              <a
                href="/counselling"
                className="rounded-full bg-[#b30018] px-10 py-5 text-center text-lg font-black text-white transition hover:scale-105"
              >
                Explore Counselling
              </a>

              <a
                href="/counselling/book"
                className="rounded-full border border-[#b30018]/15 px-10 py-5 text-center text-lg font-black transition hover:bg-[#b30018] hover:text-white"
              >
                Book A Session
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
