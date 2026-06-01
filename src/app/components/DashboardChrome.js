"use client";

import { usePathname } from "next/navigation";

export default function DashboardChrome() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Browse", href: "/browse" },
    { label: "Likes", href: "/likes" },
    { label: "Messages", href: "/messages" },
    { label: "Profile", href: "/profile/setup" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#7a0010]/95 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/dashboard" className="flex items-center">
          <img
            src="/dellys-logo.png"
            alt="Delly's Matchups"
            className="h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)]"
          />
        </a>

        <nav className="hidden items-center gap-3 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;

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

        <a
          href="/"
          className="hidden rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/15 hover:text-white lg:block"
        >
          Home
        </a>
      </div>
    </header>
  );
}
