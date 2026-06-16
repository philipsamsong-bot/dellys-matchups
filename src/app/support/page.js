import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const supportOptions = [
  {
    title: "One-time Donations",
    description: "Support Delly's Matchups with a one-time gift.",
    href: "/support/donations",
  },
  {
    title: "Become a Partner",
    description: "Partner with the mission and support the community.",
    href: "/support/partner",
  },
  {
    title: "Submit Testimonial",
    description: "Share your story, testimony, or experience.",
    href: "/support/testimonial",
  },
];

export default function SupportPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <section className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.35em] text-red-100">
              Support
            </p>
            <h1 className="font-display mt-5 text-6xl font-bold md:text-8xl">
              Support The Mission
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
              Choose how you would like to support Delly&apos;s Matchups.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {supportOptions.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[3rem] bg-black/25 p-8 shadow-2xl transition hover:scale-[1.02] hover:bg-white hover:text-[#b30018]"
              >
                <h2 className="font-display text-4xl font-bold">
                  {item.title}
                </h2>
                <p className="mt-5 leading-8 text-white/70 group-hover:text-black/70">
                  {item.description}
                </p>
                <span className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-[#b30018]">
                  Continue
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
