"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function SiteNav() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [counsellingOpen, setCounsellingOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
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
          <a href="/">Home</a>

          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button type="button">About ▾</button>

            {aboutOpen && (
              <div className="absolute left-0 top-full z-50 pt-4">
                <div className="w-72 rounded-2xl bg-black p-5 shadow-2xl">
                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/platform"
                  >
                    The Platform
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/founder"
                  >
                    The Founder
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy"
                  >
                    Academy
                  </a>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setAcademyOpen(true)}
            onMouseLeave={() => setAcademyOpen(false)}
          >
            <button type="button">Academy ▾</button>

            {academyOpen && (
              <div className="absolute left-0 top-full z-50 pt-4">
                <div className="w-96 rounded-2xl bg-black p-5 shadow-2xl">
                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-1"
                  >
                    Module 1: Counselling 101
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-2"
                  >
                    Module 2: Counselling 102
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-3"
                  >
                    Module 3: Counselling 103
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-4"
                  >
                    Module 4: Leadership & Influence
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-5"
                  >
                    Module 5: Healing & Restoration
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-6"
                  >
                    Module 6: Master Classes
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/about/academy/module-7"
                  >
                    Module 7: Virginity 101
                  </a>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <button type="button">Shop ▾</button>

            {shopOpen && (
              <div className="absolute left-0 top-full z-50 pt-4">
                <div className="w-72 rounded-2xl bg-black p-5 shadow-2xl">
                  <a
                    className="block py-3 hover:text-red-200"
                    href="/shop/books"
                  >
                    Books
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/shop/merch"
                  >
                    Merch
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/shop/audio"
                  >
                    Audio Messages
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/shop/ebooks"
                  >
                    eBooks / Kindle
                  </a>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setCounsellingOpen(true)}
            onMouseLeave={() => setCounsellingOpen(false)}
          >
            <button type="button">Counselling ▾</button>

            {counsellingOpen && (
              <div className="absolute left-0 top-full z-50 pt-4">
                <div className="w-80 rounded-2xl bg-black p-5 shadow-2xl">
                 <a
                 className="block py-3 hover:text-red-200"
                 href="/counselling"
                 
                 >
                    Counselling Overview
                 </a>


                  <a
                    className="block py-3 hover:text-red-200"
                    href="/counselling/premarital"
                  >
                    Premarital Counselling
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/counselling/marital"
                  >
                    Marital Counselling
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/counselling/purpose"
                  >
                    Purpose Discovery
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/counselling/healing"
                  >
                    Emotional Healing
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/counselling/coaching"
                  >
                    Mentorship & Coaching
                  </a>
                </div>
              </div>
            )}
          </div>

          <a href="/#matchups">Matchups</a>

          <div
            className="relative"
            onMouseEnter={() => setBlogOpen(true)}
            onMouseLeave={() => setBlogOpen(false)}
          >
            <button type="button">Blog ▾</button>

            {blogOpen && (
              <div className="absolute left-0 top-full z-50 pt-4">
                <div className="w-72 rounded-2xl bg-black p-5 shadow-2xl">
                  <a
                    className="block py-3 hover:text-red-200"
                    href="/blog/exceptional-cases"
                  >
                    Exceptional Cases
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/newsletter"
                  >
                    Newsletter
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/blog/articles"
                  >
                    Articles
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/gallery"
                  >
                    Gallery
                  </a>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setSupportOpen(true)}
            onMouseLeave={() => setSupportOpen(false)}
          >
            <button type="button">Support ▾</button>

            {supportOpen && (
              <div className="absolute left-0 top-full z-50 pt-4">
                <div className="w-72 rounded-2xl bg-black p-5 shadow-2xl">
                  <a
                    className="block py-3 hover:text-red-200"
                    href="/support/donate"
                  >
                    Onetime Donations
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/support/partner"
                  >
                    Become a Partner
                  </a>

                  <a
                    className="block py-3 hover:text-red-200"
                    href="/support/testimonial"
                  >
                    Submit Testimonial
                  </a>
                </div>
              </div>
            )}
          </div>

          <a href="/contact">Contact Us</a>
        </div>

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

    const email = event.target.email.value;

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email }]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Successfully subscribed!");

    event.target.reset();
  }}
  className="mt-5 flex gap-3 md:mt-0"
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
    className="rounded-xl bg-black px-8 font-black uppercase"
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
              <a className="block hover:text-white" href="/">Home</a>
              <a className="block hover:text-white" href="/about/platform">About Platform</a>
              <a className="block hover:text-white" href="/about/founder">About Founder</a>
              <a className="block hover:text-white" href="/about/academy">The Academy</a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black">Counselling</h3>
            <div className="mt-6 space-y-4 text-white/70">
              <a className="block hover:text-white" href="/counselling/premarital">Premarital Counselling</a>
              <a className="block hover:text-white" href="/counselling/marital">Marital Counselling</a>
              <a className="block hover:text-white" href="/counselling/healing">Emotional Healing</a>
              <a className="block hover:text-white" href="/#matchups">Matchups</a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black">Contact Us</h3>
            <div className="mt-6 space-y-4 text-white/70">
              <a className="block hover:text-white" href="https://wa.me/237676257187" target="_blank" rel="nooopener noreferrer">WhatsApp</a>
              <a className="block hover:text-white" href="https://www.facebook.com/dellysmatchupsre" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a className="block hover:text-white" href="https://www.instagram.com/dellysmatchups" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a className="block hover:text-white" href="mailto:infodellysmatchups@gmail.com">Mail Us</a>
            </div>
          </div>
        </div>

        <p className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          © 2026 Delly’s Matchups. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
