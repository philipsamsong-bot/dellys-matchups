"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import PostInteractions from "@/app/components/PostInteractions";
import { supabase } from "@/lib/supabase";

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug;

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
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

    if (slug) {
      loadArticle();
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-[#b30018] px-6 pt-44 text-white">
          <p className="text-center text-xl font-black">Loading article...</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-[#b30018] px-6 pt-44 text-white">
          <div className="mx-auto max-w-5xl rounded-[3rem] bg-black/25 p-10 text-center">
            <h1 className="font-display text-6xl font-bold">
              Article Not Found
            </h1>

            <a
              href="/blog/articles"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
            >
              Back to Articles
            </a>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-40 text-white">
        <article className="mx-auto max-w-7xl">
          <section className="rounded-[3rem] bg-black/25 p-8 shadow-2xl backdrop-blur-xl md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
              <div>
                <p className="font-black uppercase tracking-[0.35em] text-red-100">
                  Article
                </p>

                <h1 className="font-display mt-5 text-5xl font-bold leading-tight md:text-7xl">
                  {article.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-white/60">
                  <span>{article.author || "Delly Singah"}</span>
                  <span>•</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-10 rounded-[2rem] bg-white/10 p-8 md:p-10">
                  <p className="whitespace-pre-line text-[1.18rem] leading-[2.15rem] tracking-[0.025em] text-white/90">
                    {article.content}
                  </p>
                </div>
              </div>

              {article.featured_image && (
                <div className="lg:pt-10">
                  <div className="overflow-hidden rounded-[2.5rem] bg-white/10 p-3">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full rounded-[2rem] object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="mt-12">
            <PostInteractions postType="article" postId={article.id} />
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
