"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardChrome() {

  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  const [hasAcademy, setHasAcademy] = useState(false);

  const [hasMatchups, setHasMatchups] = useState(false);

  useEffect(() => {

    loadAccess();

  }, []);

  async function loadAccess() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { count: academyTotal } = await supabase

      .from("academy_enrollments")

      .select("*", {
        count: "exact",
        head: true,
      })

      .eq("user_email", user.email)

      .eq("status", "active");

    const { data: profile } = await supabase

      .from("profiles")

      .select("*")

      .eq("id", user.id)

      .single();

    setHasAcademy((academyTotal || 0) > 0);

    setHasMatchups(
      !!profile &&
      profile.marital_status !== "Married"
    );
  }

  const links = [

    {
      label: "Dashboard",
      href: "/dashboard",
    },

    ...(hasMatchups
      ? [
          {
            label: "Browse",
            href: "/browse",
          },

          {
            label: "Likes",
            href: "/likes",
          },

          {
            label: "Messages",
            href: "/messages",
          },
        ]
      : []),

    ...(hasAcademy
      ? [
          {
            label: "My Academy",
            href: "/dashboard/my-academy",
          },
        ]
      : []),

    {
      label: "Profile",
      href: "/profile/setup",
    },
  ];

  async function handleSignOut() {

    setSigningOut(true);

    const { error } =
      await supabase.auth.signOut();

    setSigningOut(false);

    if (error) {

      alert(error.message);

      return;
    }

    window.location.href =
      "/auth/login";
  }

  function isActive(href) {

    return (
      pathname === href ||

      pathname.startsWith(`${href}/`)
    );
  }
  return (

    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#7a0010]/95 backdrop-blur-2xl">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <a
          href="/dashboard"
          className="flex items-center"
        >

          <img
            src="/dellys-logo.png"

            alt="Delly's Matchups"

            className="h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)]"
          />

        </a>

        <nav className="hidden items-center gap-3 lg:flex">

          {links.map((link) => {

            const active =
              isActive(link.href);

            return (

              <a
                key={link.href}

                href={link.href}

                className={`rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.22em] transition-all duration-300 ${
                  active
                    ? "bg-white text-[#b30018] shadow-2xl"
                    : "bg-white/5 text-white/75 hover:bg-white/15 hover:text-white"
                }`}
              >

                {link.label}

              </a>

            );
          })}

        </nav>

        <div className="flex items-center gap-4">

          <a
            href="/"

            className="hidden rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/15 hover:text-white lg:block"
          >

            Home

          </a>

          <button
            type="button"

            onClick={handleSignOut}

            disabled={signingOut}

            className="hidden rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#b30018] transition hover:scale-105 disabled:opacity-60 lg:block"
          >

            {signingOut
              ? "Signing Out..."
              : "Sign Out"}

          </button>

          <button
            type="button"

            onClick={() =>
              setMobileOpen(
                (current) => !current
              )
            }

            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-2xl font-black text-white lg:hidden"
          >

            {mobileOpen ? "×" : "☰"}

          </button>

        </div>

      </div>

      {mobileOpen && (

        <nav className="border-t border-white/10 bg-[#7a0010] px-6 pb-6 pt-4 lg:hidden">

          <div className="mx-auto flex max-w-7xl flex-col gap-3">

            {links.map((link) => {

              const active =
                isActive(link.href);

              return (

                <a
                  key={link.href}

                  href={link.href}

                  onClick={() =>
                    setMobileOpen(false)
                  }

                  className={`rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.18em] transition ${
                    active
                      ? "bg-white text-[#b30018]"
                      : "bg-white/5 text-white/80 hover:bg-white/15"
                  }`}
                >

                  {link.label}

                </a>

              );
            })}

            <a
              href="/"

              onClick={() =>
                setMobileOpen(false)
              }

              className="rounded-2xl border border-white/15 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white/80"
            >

              Home

            </a>

            <button
              type="button"

              onClick={handleSignOut}

              disabled={signingOut}

              className="rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#b30018]"
            >

              {signingOut
                ? "Signing Out..."
                : "Sign Out"}

            </button>

          </div>

        </nav>

      )}

    </header>

  );
}
