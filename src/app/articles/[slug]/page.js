"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

export default function ArticleDetailsPage() {
  const params = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", params.slug)
        .eq("published", true)
        .single();

      if (error) {
        setArticle(null);
        setLoading(false);
        return;
      }

      setArticle(data);
      setLoading(false);
    }

    if (params.slug) {
      loadArticle();
    }
  }, [params.slug]);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <p className="text-center text-xl font-bold">Loading article...</p>
          ) : !article ? (
            <div className="rounded-[3rem] bg-[#c1121f] p-10 text-center">
              <h1 className="font-display text-5xl font-bold">
                Article Not Found
              </h1>
              <a
                href="/articles"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
              >
                Back To Articles
              </a>
            </div>
          ) : (
            <article className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
              {article.featured_image && (
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="mb-10 h-[460px] w-full rounded-[2rem] object-cover"
                />
              )}

              <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                {article.author || "Delly Singah"}
              </p>

              <h1 className="font-display mt-6 text-5xl font-bold leading-none md:text-7xl">
                {article.title}
              </h1>

              <div className="mt-10 whitespace-pre-line text-lg leading-9 text-white/85">
                {article.content}
              </div>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/articles"
                  className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
                >
                  Back To Articles
                </a>

                <a
                  href="/dashboard"
                  className="rounded-full border border-white/20 px-8 py-4 font-black text-white transition hover:bg-white/10"
                >
                  Member Dashboard
                </a>
              </div>
            </article>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
