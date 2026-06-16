"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const menuGroups = [
  {
    label: "About",
    items: [
      { label: "The Platform", href: "/about/platform" },
      { label: "The Founder", href: "/about/founder" },
      { label: "The Academy", href: "/about/academy" },
    ],
  },
  {
    label: "The Academy",
    items: [
      {
        label: "Join Full Academy Programme",
        href: "/academy/checkout?course=full-academy",
      },
      { label: "Module 1: Counselling 101", href: "/about/academy/module-1" },
      { label: "Module 2: Counselling 102", href: "/about/academy/module-2" },
      { label: "Module 3: Counselling 103", href: "/about/academy/module-3" },
      {
        label: "Module 4: Leadership & Influence",
        href: "/about/academy/module-4",
      },
      {
        label: "Module 5: Healing & Restoration",
        href: "/about/academy/module-5",
      },
      { label: "Module 6: Master Classes", href: "/about/academy/module-6" },
      { label: "Module 7: Virginity 101", href: "/about/academy/module-7" },
    ],
  },
  {
    label: "Shop",
    items: [
      { label: "Books", href: "/shop/books" },
      { label: "Merch", href: "/shop/merch" },
      { label: "Audio Messages", href: "/shop/audio" },
      { label: "eBooks / Kindle", href: "/shop/ebooks" },
    ],
  },
  {
    label: "Counselling",
    items: [
      { label: "Counselling Overview", href: "/counselling" },
      { label: "Premarital Counselling", href: "/counselling/premarital" },
      { label: "Marital Counselling", href: "/counselling/marital" },
      { label: "Purpose Discovery", href: "/counselling/purpose" },
      { label: "Emotional Healing", href: "/counselling/healing" },
      { label: "Mentorship & Coaching", href: "/counselling/coaching" },
    ],
  },
  {
    label: "Blog",
    items: [
      { label: "Exceptional Cases", href: "/blog/exceptional-cases" },
      { label: "Articles", href: "/blog/articles" },
      { label: "Gallery", href: "/blog/gallery" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "One-time Donations", href: "/support/donations" },
      { label: "Become a Partner", href: "/support/partner" },
      { label: "Submit Testimonial", href: "/support/testimonial" },
    ],
  },
];

export function SiteNav() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    getUser();
  }, []);

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#950014]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-28 max-w-7xl items-center justify-between px-6">
        <a href="/" className="flex shrink-0 items-center">
          <img
            src="/dellys-logo.png"
            alt="Delly's Matchups"
            className="h-24 w-auto object-contain"
          />
        </a>

        <div className="hidden items-center gap-6 text-sm font-bold text-white lg:flex">
          <a href="/" className="transition hover:text-red-100">
            Home
          </a>

          {menuGroups.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpenMenu(group.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button type="button" className="transition hover:text-red-100">
                {group.label} ▾
              </button>

              {openMenu === group.label && (
                <div className="absolute left-0 top-full z-50 pt-4">
                  <div className="w-80 rounded-3xl border border-white/20 bg-black p-5 shadow-[0_30px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    {group.items.map((item) => (
                      <a
                        key={item.href}
                        className="block rounded-xl px-4 py-3 text-white transition-all duration-300 hover:bg-white/10 hover:text-red-200"
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <a href="/#matchups" className="transition hover:text-red-100">
            Matchups
          </a>

          <a href="/contact" className="transition hover:text-red-100">
            Contact Us
          </a>
        </div>

        <button
          onClick={() => setMobileOpen((current) => !current)}
          className="text-3xl text-white lg:hidden"
          type="button"
          aria-label="Open menu"
        >
          {mobileOpen ? "×" : "☰"}
        </button>

        <div className="hidden gap-4 lg:flex">
          {user ? (
            <a
              href="/dashboard"
              className="rounded-full bg-white px-6 py-3 font-bold text-[#b30018] transition hover:scale-105"
            >
              Dashboard
            </a>
          ) : (
            <>
              <a
                href="/auth/login"
                className="rounded-full border border-white/20 px-6 py-3 font-bold transition hover:bg-white/10"
              >
                Sign In
              </a>

              <a
                href="/auth/signup"
                className="rounded-full bg-white px-6 py-3 font-bold text-[#b30018] transition hover:scale-105"
              >
                Join Free
              </a>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="bg-[#950014] px-6 pb-6 lg:hidden">
          <div className="flex flex-col gap-4 text-white">
            <a href="/" onClick={() => setMobileOpen(false)}>
              Home
            </a>

            {menuGroups.map((group) => (
              <details key={group.label}>
                <summary className="cursor-pointer font-bold">
                  {group.label}
                </summary>

                <div className="mt-3 flex flex-col gap-3 pl-4 text-white/80">
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </details>
            ))}

            <a href="/#matchups" onClick={() => setMobileOpen(false)}>
              Matchups
            </a>

            <a href="/contact" onClick={() => setMobileOpen(false)}>
              Contact Us
            </a>

            {user ? (
              <a
                href="/dashboard"
                className="rounded-full bg-white px-6 py-3 text-center font-bold text-[#b30018]"
              >
                Dashboard
              </a>
            ) : (
              <>
                <a
                  href="/auth/login"
                  className="rounded-full border border-white/20 px-6 py-3 text-center font-bold"
                >
                  Sign In
                </a>

                <a
                  href="/auth/signup"
                  className="rounded-full bg-white px-6 py-3 text-center font-bold text-[#b30018]"
                >
                  Join Free
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080304] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-5 md:grid-cols-4">
          {["Prompt Delivery", "No Returns", "Secure Payment", "24/7 Support"].map(
            (item) => (
              <div
                key={item}
                className="rounded-xl bg-white/10 px-6 py-4 text-center text-sm font-black uppercase tracking-wide"
              >
                {item}
              </div>
            )
          )}
        </div>

        <div className="mb-16 rounded-2xl bg-[#b30018] p-6 md:flex md:items-center md:justify-between">
          <h2 className="text-3xl font-black uppercase tracking-[0.2em]">
            Join Our Newsletter
          </h2>

          <form
            onSubmit={async (event) => {
              event.preventDefault();

              const email = event.currentTarget.email.value.trim().toLowerCase();

              const { error } = await supabase
                .from("newsletter_subscribers")
                .insert([{ email }]);

              if (error) {
                if (error.message.includes("newsletter_subscribers_email_key")) {
                  alert("You are already subscribed to our newsletter.");
                  return;
                }

                alert("Unable to subscribe. Please try again.");
                return;
              }

              alert("Successfully subscribed to the Delly's Matchups newsletter.");
              event.currentTarget.reset();
            }}
            className="mt-5 flex flex-col gap-3 md:mt-0 md:flex-row"
          >
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="h-14 w-full rounded-xl px-5 text-black outline-none md:w-80"
              required
            />

            <button
              type="submit"
              className="rounded-xl bg-black px-8 py-4 font-black uppercase md:py-0"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid gap-12 lg:grid-cols-4">
          <div>
            <img
              src="/dellys-logo.png"
              alt="Delly's Matchups"
              className="h-28 w-auto object-contain"
            />

            <p className="mt-6 leading-8 text-white/70">
              A global faith-based matchmaking, counselling and mentorship
              platform redefining authentic relationships.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-black">Quick Links</h3>

            <div className="mt-6 space-y-4 text-white/70">
              <a className="block hover:text-white" href="/">
                Home
              </a>
              <a className="block hover:text-white" href="/about/platform">
                The Platform
              </a>
              <a className="block hover:text-white" href="/about/founder">
                The Founder
              </a>
              <a className="block hover:text-white" href="/about/academy">
                The Academy
              </a>
              <a
                className="block hover:text-white"
                href="/academy/checkout?course=full-academy"
              >
                Join Full Academy Programme
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black">Counselling</h3>

            <div className="mt-6 space-y-4 text-white/70">
              <a
                className="block hover:text-white"
                href="/counselling/premarital"
              >
                Premarital Counselling
              </a>
              <a className="block hover:text-white" href="/counselling/marital">
                Marital Counselling
              </a>
              <a className="block hover:text-white" href="/counselling/healing">
                Emotional Healing
              </a>
              <a className="block hover:text-white" href="/#matchups">
                Matchups
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black">Company Information</h3>

            <div className="mt-6 space-y-3 text-white/70">
              <p>DELLY&apos;S MATCHUPS LTD</p>
              <p>Registered in England &amp; Wales</p>
              <p>Company No: 17251701</p>

              <a
                className="block hover:text-white"
                href="mailto:infodellysmatchups@gmail.com"
              >
                infodellysmatchups@gmail.com
              </a>

              <a
                className="block hover:text-white"
                href="https://wa.me/237676257187"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>

              <a
                className="block hover:text-white"
                href="https://www.facebook.com/dellysmatchupsre"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>

              <a
                className="block hover:text-white"
                href="https://www.instagram.com/dellysmatchups"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <p className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          © 2026 DELLY&apos;S MATCHUPS LTD. Company No. 17251701. Registered in
          England &amp; Wales. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
