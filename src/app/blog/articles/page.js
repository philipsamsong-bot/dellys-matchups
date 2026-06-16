"use client";

import { useEffect, useState } from "react";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

function getPreview(content) {
  return content?.replace(/\s+/g, " ").trim().slice(0, 180) || "";
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error) {
        setArticles(data || []);
      }

      setLoading(false);
    }

    loadArticles();
  }, []);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <section className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-black uppercase tracking-[0.35em] text-red-100">
              Articles
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold md:text-8xl">
              Wisdom for Intentional Living
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
              Read teachings, reflections, and practical wisdom from Delly
              Singah.
            </p>
          </div>

          {loading && (
            <p className="mt-16 text-center text-xl font-black">
              Loading articles...
            </p>
          )}

          {!loading && articles.length === 0 && (
            <div className="mx-auto mt-16 max-w-3xl rounded-[3rem] bg-black/25 p-10 text-center">
              <h2 className="font-display text-5xl font-bold">
                No Articles Published Yet
              </h2>
            </div>
          )}

          <div className="mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-[3rem] bg-black/25 shadow-2xl"
              >
                <div className="flex h-72 items-center justify-center bg-white/10">
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <p className="font-display text-5xl text-white/40">DM</p>
                  )}
                </div>

                <div className="p-8">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-red-100">
                    {article.author || "Delly Singah"}
                  </p>

                  <h2 className="font-display mt-5 text-4xl font-bold leading-none">
                    {article.title}
                  </h2>

                  <p className="mt-5 leading-8 text-white/75">
                    {getPreview(article.content)}...
                  </p>

                  <a
                    href={`/blog/articles/${article.slug}`}
                    className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-[#b30018]"
                  >
                    Read Article
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
