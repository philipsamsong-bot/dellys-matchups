// src/app/articles/[slug]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";

const REACTION_OPTIONS = [
  { type: "like", label: "👍 Like" },
  { type: "love", label: "❤️ Love" },
  { type: "fire", label: "🔥 Fire" },
  { type: "pray", label: "🙏 Pray" },
];

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function ArticleDetailsPage() {
  const params = useParams();
  const slug = params?.slug;

  const [user, setUser] = useState(null);
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [commentForm, setCommentForm] = useState("");
  const [pageError, setPageError] = useState("");

  const reactionCounts = useMemo(() => {
    return reactions.reduce((accumulator, reaction) => {
      const type = reaction.reaction_type || "like";
      accumulator[type] = (accumulator[type] || 0) + 1;
      return accumulator;
    }, {});
  }, [reactions]);

  const myReaction = useMemo(() => {
    if (!user) return null;
    return reactions.find((reaction) => reaction.user_id === user.id)?.reaction_type || null;
  }, [reactions, user]);

  useEffect(() => {
    async function loadUserAndArticle() {
      setLoading(true);
      setPageError("");

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(authUser || null);

      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (articleError || !articleData) {
        setArticle(null);
        setComments([]);
        setReactions([]);
        setLoading(false);
        return;
      }

      setArticle(articleData);

      const [commentsResult, reactionsResult] = await Promise.all([
        supabase
          .from("article_comments")
          .select("*")
          .eq("article_id", articleData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("article_reactions")
          .select("*")
          .eq("article_id", articleData.id),
      ]);

      if (commentsResult.error) {
        setPageError(commentsResult.error.message);
      } else {
        setComments(commentsResult.data || []);
      }

      if (reactionsResult.error) {
        setPageError((current) => current || reactionsResult.error.message);
      } else {
        setReactions(reactionsResult.data || []);
      }

      setLoading(false);
    }

    if (slug) {
      loadUserAndArticle();
    }
  }, [slug]);

  async function refreshComments() {
    if (!article?.id) return;

    const { data, error } = await supabase
      .from("article_comments")
      .select("*")
      .eq("article_id", article.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setComments(data || []);
  }

  async function refreshReactions() {
    if (!article?.id) return;

    const { data, error } = await supabase
      .from("article_reactions")
      .select("*")
      .eq("article_id", article.id);

    if (error) {
      alert(error.message);
      return;
    }

    setReactions(data || []);
  }

  async function handleSubmitComment(event) {
    event.preventDefault();

    if (!user) {
      alert("Please sign in to comment.");
      return;
    }

    if (!article?.id) {
      alert("Article not found.");
      return;
    }

    const content = commentForm.trim();

    if (!content) {
      alert("Please write a comment.");
      return;
    }

    setCommentLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      const authorName =
        profile?.full_name || user.user_metadata?.full_name || user.email || "Member";
      const authorEmail = profile?.email || user.email || null;

      const { error } = await supabase.from("article_comments").insert({
        article_id: article.id,
        user_id: user.id,
        author_name: authorName,
        author_email: authorEmail,
        content,
      });

      if (error) {
        throw error;
      }

      setCommentForm("");
      await refreshComments();
    } catch (error) {
      alert(error.message);
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleReaction(nextReactionType) {
    if (!user) {
      alert("Please sign in to react.");
      return;
    }

    if (!article?.id) {
      alert("Article not found.");
      return;
    }

    setReactionLoading(true);

    try {
      const { data: existingReaction, error: existingError } = await supabase
        .from("article_reactions")
        .select("*")
        .eq("article_id", article.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingReaction?.reaction_type === nextReactionType) {
        const { error: deleteError } = await supabase
          .from("article_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (deleteError) {
          throw deleteError;
        }
      } else if (existingReaction) {
        const { error: updateError } = await supabase
          .from("article_reactions")
          .update({ reaction_type: nextReactionType })
          .eq("id", existingReaction.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("article_reactions")
          .insert({
            article_id: article.id,
            user_id: user.id,
            reaction_type: nextReactionType,
          });

        if (insertError) {
          throw insertError;
        }
      }

      await refreshReactions();
    } catch (error) {
      alert(error.message);
    } finally {
      setReactionLoading(false);
    }
  }

  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-44 text-white">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <p className="text-center text-xl font-bold">Loading article...</p>
          ) : !article ? (
            <div className="rounded-[3rem] bg-[#c1121f] p-10 text-center">
              <h1 className="font-display text-5xl font-bold">Article Not Found</h1>
              <a
                href="/articles"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018]"
              >
                Back To Articles
              </a>
            </div>
          ) : (
            <>
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

                <div className="mt-12 rounded-[2rem] border border-white/15 bg-white/10 p-6">
                  <h2 className="font-display text-3xl font-bold">Reactions</h2>

                  <p className="mt-2 text-white/70">
                    {user
                      ? "React to this article."
                      : "Sign in to like or react to this article."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {REACTION_OPTIONS.map((reaction) => {
                      const active = myReaction === reaction.type;
                      const count = reactionCounts[reaction.type] || 0;

                      return (
                        <button
                          key={reaction.type}
                          type="button"
                          disabled={reactionLoading}
                          onClick={() => handleReaction(reaction.type)}
                          className={`rounded-full px-6 py-3 font-black transition ${
                            active
                              ? "bg-white text-[#b30018]"
                              : "border border-white/20 bg-transparent text-white hover:bg-white/10"
                          } ${reactionLoading ? "opacity-60" : ""}`}
                        >
                          {reaction.label} ({count})
                        </button>
                      );
                    })}
                  </div>
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

              <section className="mt-10 rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
                <h2 className="font-display text-4xl font-bold">Comments</h2>

                {pageError ? (
                  <p className="mt-4 rounded-2xl bg-white/10 px-5 py-4 text-white/85">
                    {pageError}
                  </p>
                ) : null}

                <form onSubmit={handleSubmitComment} className="mt-8">
                  <textarea
                    value={commentForm}
                    onChange={(event) => setCommentForm(event.target.value)}
                    placeholder={
                      user ? "Write your comment..." : "Sign in to write a comment..."
                    }
                    disabled={!user || commentLoading}
                    rows={5}
                    className="w-full rounded-[2rem] border border-white/15 bg-white/10 px-5 py-5 text-white outline-none placeholder:text-white/60 disabled:opacity-60"
                  />

                  <button
                    type="submit"
                    disabled={!user || commentLoading}
                    className="mt-5 rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                  >
                    {commentLoading ? "Posting..." : "Post Comment"}
                  </button>
                </form>

                <div className="mt-10 space-y-5">
                  {comments.length === 0 ? (
                    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white/75">
                      No comments yet. Be the first to comment.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-[2rem] border border-white/15 bg-white/10 p-6"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <p className="font-black text-white">
                            {comment.author_name || "Member"}
                          </p>

                          <p className="text-sm text-white/60">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>

                        <p className="mt-4 whitespace-pre-line leading-8 text-white/85">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
