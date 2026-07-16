// src/app/components/PostInteractions.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const ARTICLE_REACTION_OPTIONS = [
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "pray", emoji: "🙏", label: "Pray" },
];

const DEFAULT_REACTION_OPTIONS = [
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "agree", emoji: "👍", label: "Agree" },
  { key: "helpful", emoji: "🙏", label: "Helpful" },
  { key: "interesting", emoji: "🤔", label: "Interesting" },
  { key: "surprise", emoji: "😮", label: "Surprise" },
  { key: "sad", emoji: "💔", label: "Sad" },
];

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function PostInteractions({ postType, postId }) {
  const isArticle = postType === "article";
  const reactionOptions = isArticle ? ARTICLE_REACTION_OPTIONS : DEFAULT_REACTION_OPTIONS;
  const commentsTable = isArticle ? "article_comments" : "comments";
  const reactionsTable = isArticle ? "article_reactions" : "reactions";

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  useEffect(() => {
    async function loadUserAndData() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(authUser || null);

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle();

        setIsAdmin(profile?.role === "admin");
      } else {
        setIsAdmin(false);
      }

      await Promise.all([loadReactions(), loadComments()]);
    }

    if (postId) {
      loadUserAndData();
    }
  }, [postId, postType]);

  async function loadReactions() {
    let query = supabase.from(reactionsTable).select("*");

    if (isArticle) {
      query = query.eq("article_id", postId);
    } else {
      query = query.eq("post_type", postType).eq("post_id", postId);
    }

    const { data, error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setReactions(data || []);
  }

  async function loadComments() {
    let query = supabase.from(commentsTable).select("*");

    if (isArticle) {
      query = query.eq("article_id", postId);
    } else {
      query = query.eq("post_type", postType).eq("post_id", postId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setComments(data || []);
  }

  const myReaction = useMemo(() => {
    if (!user) return null;

    if (isArticle) {
      return reactions.find((item) => item.user_id === user.id)?.reaction_type || null;
    }

    return reactions.find((item) => item.user_id === user.id)?.reaction || null;
  }, [isArticle, reactions, user]);

  function getReactionCount(reactionKey) {
    return reactions.filter((item) => {
      const value = isArticle ? item.reaction_type : item.reaction;
      return value === reactionKey;
    }).length;
  }

  function canManageComment(comment) {
    return Boolean(user && (comment.user_id === user.id || isAdmin));
  }

  async function handleReaction(reactionKey) {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    setReactionLoading(true);

    try {
      if (isArticle) {
        const existingReaction = reactions.find((item) => item.user_id === user.id);

        if (existingReaction?.reaction_type === reactionKey) {
          const { error } = await supabase
            .from(reactionsTable)
            .delete()
            .eq("id", existingReaction.id);

          if (error) throw error;
        } else if (existingReaction) {
          const { error } = await supabase
            .from(reactionsTable)
            .update({ reaction_type: reactionKey })
            .eq("id", existingReaction.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from(reactionsTable).insert({
            article_id: postId,
            user_id: user.id,
            reaction_type: reactionKey,
          });

          if (error) throw error;
        }
      } else {
        const existingReaction = reactions.find(
          (item) => item.user_id === user.id && item.reaction === reactionKey
        );

        if (existingReaction) {
          const { error } = await supabase
            .from(reactionsTable)
            .delete()
            .eq("id", existingReaction.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from(reactionsTable).insert({
            post_type: postType,
            post_id: postId,
            user_id: user.id,
            reaction: reactionKey,
          });

          if (error) throw error;
        }
      }

      await loadReactions();
    } catch (error) {
      alert(error.message);
    } finally {
      setReactionLoading(false);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const content = commentText.trim();
    if (!content) return;

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      const authorName =
        profile?.full_name || user.user_metadata?.full_name || user.email || "Anonymous";
      const authorEmail = profile?.email || user.email || null;

      const payload = isArticle
        ? {
            article_id: postId,
            user_id: user.id,
            author_name: authorName,
            author_email: authorEmail,
            content,
          }
        : {
            post_type: postType,
            post_id: postId,
            user_id: user.id,
            author_name: authorName,
            content,
            parent_id: null,
          };

      const { error } = await supabase.from(commentsTable).insert(payload);

      if (error) throw error;

      setCommentText("");
      await loadComments();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReplySubmit(parentId) {
    if (isArticle) {
      alert("Replies are not enabled for article comments yet.");
      return;
    }

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const content = replyText[parentId]?.trim();
    if (!content) return;

    const authorName =
      user.user_metadata?.full_name || user.email || "Anonymous";

    const { error } = await supabase.from(commentsTable).insert({
      post_type: postType,
      post_id: postId,
      user_id: user.id,
      author_name: authorName,
      content,
      parent_id: parentId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setReplyText((current) => ({
      ...current,
      [parentId]: "",
    }));

    await loadComments();
  }

  function startEditing(comment) {
    setEditingId(comment.id);
    setEditingText(comment.content);
  }

  async function saveEdit(commentId) {
    if (!editingText.trim()) return;

    const updates = {
      content: editingText.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(commentsTable)
      .update(updates)
      .eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingId(null);
    setEditingText("");
    await loadComments();
  }

  async function deleteComment(commentId) {
    const confirmed = confirm("Delete this comment?");
    if (!confirmed) return;

    if (isArticle) {
      const { error } = await supabase
        .from(commentsTable)
        .delete()
        .eq("id", commentId);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from(commentsTable)
        .update({
          content: "This comment has been deleted.",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", commentId);

      if (error) {
        alert(error.message);
        return;
      }
    }

    await loadComments();
  }

  const topLevelComments = isArticle
    ? comments
    : comments.filter((comment) => !comment.parent_id);

  function getReplies(commentId) {
    if (isArticle) return [];
    return comments.filter((comment) => comment.parent_id === commentId);
  }

  function CommentBody({ comment }) {
    const isDeleted = Boolean(comment.deleted_at);

    if (editingId === comment.id && !isDeleted) {
      return (
        <div className="mt-4">
          <textarea
            rows={3}
            value={editingText}
            onChange={(event) => setEditingText(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none"
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => saveEdit(comment.id)}
              className="rounded-full bg-white px-5 py-2 font-black text-[#b30018]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setEditingText("");
              }}
              className="rounded-full border border-white/20 px-5 py-2 font-black text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <p
        className={`mt-4 whitespace-pre-line leading-8 ${
          isDeleted ? "italic text-white/45" : "text-white/80"
        }`}
      >
        {comment.content}
      </p>
    );
  }

  return (
    <section className="mt-16 rounded-[3rem] border border-white/10 bg-black/20 p-6 text-white shadow-2xl md:p-10">
      <h2 className="font-display text-4xl font-bold">Join The Conversation</h2>

      <div className="mt-8 flex flex-wrap gap-3">
        {reactionOptions.map((reaction) => {
          const active = myReaction === reaction.key;

          return (
            <button
              key={reaction.key}
              type="button"
              disabled={reactionLoading}
              onClick={() => handleReaction(reaction.key)}
              className={`rounded-full border px-5 py-3 font-bold transition ${
                active
                  ? "border-white bg-white text-[#b30018]"
                  : "border-white/10 bg-white/10 hover:bg-white hover:text-[#b30018]"
              } ${reactionLoading ? "opacity-60" : "text-white"}`}
            >
              {reaction.emoji} {reaction.label} {getReactionCount(reaction.key)}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleCommentSubmit} className="mt-10">
        <textarea
          rows={4}
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Leave your thoughts..."
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-full bg-white px-8 py-4 font-black text-[#b30018] disabled:opacity-60"
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </form>

      <div className="mt-12 space-y-6">
        {topLevelComments.length === 0 && (
          <p className="text-white/60">No comments yet. Be the first to respond.</p>
        )}

        {topLevelComments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-[2rem] border border-white/10 bg-white/10 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black">{comment.author_name || "Anonymous"}</p>
                {comment.updated_at && !comment.deleted_at && (
                  <p className="mt-1 text-xs text-white/40">Edited</p>
                )}
              </div>

              <p className="text-xs text-white/50">{formatDate(comment.created_at)}</p>
            </div>

            <CommentBody comment={comment} />

            {canManageComment(comment) && !comment.deleted_at && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => startEditing(comment)}
                  className="text-sm font-bold text-white/70 hover:text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id)}
                  className="text-sm font-bold text-red-200 hover:text-white"
                >
                  Delete
                </button>
              </div>
            )}

            {!isArticle && getReplies(comment.id).length > 0 && (
              <div className="mt-5 space-y-4">
                {getReplies(comment.id).map((reply) => (
                  <div
                    key={reply.id}
                    className="ml-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black">{reply.author_name || "Anonymous"}</p>
                        {reply.updated_at && !reply.deleted_at && (
                          <p className="mt-1 text-xs text-white/40">Edited</p>
                        )}
                      </div>

                      <p className="text-xs text-white/50">
                        {formatDate(reply.created_at)}
                      </p>
                    </div>

                    <CommentBody comment={reply} />

                    {canManageComment(reply) && !reply.deleted_at && (
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(reply)}
                          className="text-sm font-bold text-white/70 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteComment(reply.id)}
                          className="text-sm font-bold text-red-200 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isArticle && !comment.deleted_at && (
              <div className="mt-5 flex gap-3">
                <input
                  type="text"
                  value={replyText[comment.id] || ""}
                  onChange={(event) =>
                    setReplyText((current) => ({
                      ...current,
                      [comment.id]: event.target.value,
                    }))
                  }
                  placeholder="Reply..."
                  className="h-12 flex-1 rounded-full border border-white/10 bg-white/10 px-5 text-white outline-none placeholder:text-white/50"
                />
                <button
                  type="button"
                  onClick={() => handleReplySubmit(comment.id)}
                  className="rounded-full bg-white px-6 font-black text-[#b30018]"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
