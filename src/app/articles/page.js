// src/app/articles/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const REACTION_BREAKDOWN = [
  { key: "like", emoji: "👍" },
  { key: "love", emoji: "❤️" },
  { key: "fire", emoji: "🔥" },
  { key: "pray", emoji: "🙏" },
];

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [reactionBreakdown, setReactionBreakdown] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticlesAndCounts() {
      setLoading(true);

      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (articleError) {
        alert(articleError.message);
        setLoading(false);
        return;
      }

      const publishedArticles = articleData || [];
      setArticles(publishedArticles);

      if (publishedArticles.length === 0) {
        setCommentCounts({});
        setReactionBreakdown({});
        setLoading(false);
        return;
      }

      const articleIds = publishedArticles.map((article) => article.id);

      const [
        { data: commentsData, error: commentsError },
        { data: reactionsData, error: reactionsError },
      ] = await Promise.all([
        supabase
          .from("article_comments")
          .select("id,article_id")
          .in("article_id", articleIds),
        supabase
          .from("article_reactions")
          .select("article_id,reaction_type")
          .in("article_id", articleIds),
      ]);

      if (commentsError) {
        alert(commentsError.message);
        setLoading(false);
        return;
      }

      if (reactionsError) {
        alert(reactionsError.message);
        setLoading(false);
        return;
      }

      const nextCommentCounts = {};
      for (const comment of commentsData || []) {
        nextCommentCounts[comment.article_id] =
          (nextCommentCounts[comment.article_id] || 0) + 1;
      }

      const nextReactionBreakdown = {};
      for (const article of publishedArticles) {
        nextReactionBreakdown[article.id] = {
          like: 0,
          love: 0,
          fire: 0,
          pray: 0,
        };
      }

      for (const reaction of reactionsData || []) {
        if (!nextReactionBreakdown[reaction.article_id]) {
          nextReactionBreakdown[reaction.article_id] = {
            like: 0,
            love: 0,
            fire: 0,
            pray: 0,
          };
        }

        const key = reaction.reaction_type || "like";
        nextReactionBreakdown[reaction.article_id][key] =
          (nextReactionBreakdown[reaction.article_id][key] || 0) + 1;
      }

      setCommentCounts(nextCommentCounts);
      setReactionBreakdown(nextReactionBreakdown);
      setLoading(false);
    }

    loadArticlesAndCounts();
  }, []);

  const articleCards = useMemo(() => {
    return articles.map((article) => ({
      ...article,
      commentCount: commentCounts[article.id] || 0,
      reactions: reactionBreakdown[article.id] || {
        like: 0,
        love: 0,
        fire: 0,
        pray: 0,
      },
    }));
  }, [articles, commentCounts, reactionBreakdown]);

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Articles
            </p>

            <h1 className="font-display mt-6 text-6xl font-bold leading-none md:text-8xl">
              Wisdom for Intentional Living
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80">
              Read teachings, reflections, and practical wisdom from Delly
              Singah.
            </p>
          </motion.div>

          {loading ? (
            <p className="mt-16 text-center text-xl font-bold">
              Loading articles...
            </p>
          ) : articleCards.length === 0 ? (
            <div className="mt-16 rounded-[3rem] bg-[#c1121f] p-10 text-center">
              <p className="text-lg text-white/80">
                No articles published yet.
              </p>
            </div>
          ) : (
            <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {articleCards.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className="overflow-hidden rounded-[3rem] bg-[#c1121f] shadow-2xl"
                >
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-white/10">
                      <span className="font-display text-5xl font-bold text-white/40">
                        DM
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-100">
                      {article.author || "Delly Singah"}
                    </p>

                    <h2 className="font-display mt-4 text-4xl font-bold leading-none">
                      {article.title}
                    </h2>

                    <p className="mt-5 line-clamp-4 leading-8 text-white/75">
                      {article.content}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-white/80">
                      <span className="rounded-full bg-white/10 px-4 py-2">
                        💬 {article.commentCount} comments
                      </span>

                      {REACTION_BREAKDOWN.map((reaction) => (
                        <span
                          key={reaction.key}
                          className="rounded-full bg-white/10 px-4 py-2"
                        >
                          {reaction.emoji} {article.reactions[reaction.key] || 0}
                        </span>
                      ))}
                    </div>

                    <a
                      href={`/articles/${article.slug}`}
                      className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-[#b30018] transition hover:scale-105"
                    >
                      Read Article
                    </a>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
