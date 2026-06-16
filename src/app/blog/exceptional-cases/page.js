"use client";

import { useEffect, useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

function getPreviewText(content) {
  if (!content) return "";
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}

export default function ExceptionalCasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      const { data, error } = await supabase
        .from("exceptional_cases")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error) {
        setCases(data || []);
      }

      setLoading(false);
    }

    loadCases();
  }, []);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.4em] text-red-100">
              Real Stories
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-8xl">
              Exceptional Cases
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
              Read real relationship situations shared anonymously by members of
              the Delly&apos;s Matchups community.
            </p>
          </div>

          {loading && (
            <p className="mt-16 text-center text-xl font-bold">
              Loading Exceptional Cases...
            </p>
          )}

          {!loading && cases.length === 0 && (
            <div className="mx-auto mt-16 max-w-3xl rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-5xl font-bold">
                No Cases Published Yet
              </h2>
              <p className="mt-5 text-white/70">
                Exceptional Cases will appear here once published.
              </p>
            </div>
          )}

          <div className="mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((caseItem) => (
              <article
                key={caseItem.id}
                className="overflow-hidden rounded-[3rem] border border-white/10 bg-black/20 shadow-2xl"
              >
                <div className="flex h-72 items-center justify-center bg-white/10">
                  {caseItem.image_url ? (
                    <img
                      src={caseItem.image_url}
                      alt={caseItem.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <p className="font-display text-5xl text-white/40">DM</p>
                  )}
                </div>

                <div className="p-8">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-red-100">
                    {caseItem.anonymous_name || "Anonymous"}
                  </p>

                  <h2 className="font-display mt-5 text-4xl font-bold leading-none">
                    {caseItem.title}
                  </h2>

                  <p className="mt-5 leading-8 text-white/75">
                    {getPreviewText(caseItem.content)}...
                  </p>

                  <div className="mt-8 flex items-center justify-between text-sm font-bold text-white/50">
                    <span>Exceptional Case</span>
                    <span>
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <a
                    href={`/blog/exceptional-cases/${caseItem.id}`}
                    className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-[#b30018] transition hover:scale-105"
                  >
                    Read Case
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
