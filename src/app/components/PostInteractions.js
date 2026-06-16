"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const reactionOptions = [
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "agree", emoji: "👍", label: "Agree" },
  { key: "helpful", emoji: "🙏", label: "Helpful" },
  { key: "interesting", emoji: "🤔", label: "Interesting" },
  { key: "surprise", emoji: "😮", label: "Surprise" },
  { key: "sad", emoji: "💔", label: "Sad" },
];

export default function PostInteractions({ postType, postId }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUserAndData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setIsAdmin(profile?.role === "admin");
      }

      await loadReactions();
      await loadComments();
    }

    loadUserAndData();
  }, [postId, postType]);

  async function loadReactions() {
    const { data, error } = await supabase
      .from("reactions")
      .select("*")
      .eq("post_type", postType)
      .eq("post_id", postId);

    if (!error) {
      setReactions(data || []);
    }
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_type", postType)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error) {
      setComments(data || []);
    }
  }

  function getReactionCount(reactionKey) {
    return reactions.filter((item) => item.reaction === reactionKey).length;
  }

  function canManageComment(comment) {
    return user && (comment.user_id === user.id || isAdmin);
  }

  async function handleReaction(reactionKey) {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const existingReaction = reactions.find(
      (item) => item.user_id === user.id && item.reaction === reactionKey
    );

    if (existingReaction) {
      await supabase.from("reactions").delete().eq("id", existingReaction.id);
      await loadReactions();
      return;
    }

    await supabase.from("reactions").insert({
      post_type: postType,
      post_id: postId,
      user_id: user.id,
      reaction: reactionKey,
    });

    await loadReactions();
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (!commentText.trim()) return;

    setLoading(true);

    const authorName =
      user.user_metadata?.full_name || user.email || "Anonymous";

    const { error } = await supabase.from("comments").insert({
      post_type: postType,
      post_id: postId,
      user_id: user.id,
      author_name: authorName,
      content: commentText,
      parent_id: null,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCommentText("");
    await loadComments();
  }

  async function handleReplySubmit(parentId) {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const content = replyText[parentId];

    if (!content?.trim()) return;

    const authorName =
      user.user_metadata?.full_name || user.email || "Anonymous";

    const { error } = await supabase.from("comments").insert({
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

    const { error } = await supabase
      .from("comments")
      .update({
        content: editingText,
        updated_at: new Date().toISOString(),
      })
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

    const { error } = await supabase
      .from("comments")
      .update({
        content: "This comment has been deleted.",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadComments();
  }

  const topLevelComments = comments.filter((comment) => !comment.parent_id);

  function getReplies(commentId) {
    return comments.filter((comment) => comment.parent_id === commentId);
  }

  function CommentBody({ comment }) {
    const isDeleted = Boolean(comment.deleted_at);

    if (editingId === comment.id && !isDeleted) {
      return (
        <div className="mt-4">
          <textarea
            rows="3"
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
      <h2 className="font-display text-4xl font-bold">
        Join The Conversation
      </h2>

      <div className="mt-8 flex flex-wrap gap-3">
        {reactionOptions.map((reaction) => (
          <button
            key={reaction.key}
            type="button"
            onClick={() => handleReaction(reaction.key)}
            className="rounded-full border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white hover:text-[#b30018]"
          >
            {reaction.emoji} {reaction.label} {getReactionCount(reaction.key)}
          </button>
        ))}
      </div>

      <form onSubmit={handleCommentSubmit} className="mt-10">
        <textarea
          rows="4"
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
          <p className="text-white/60">
            No comments yet. Be the first to respond.
          </p>
        )}

        {topLevelComments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-[2rem] border border-white/10 bg-white/10 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black">
                  {comment.author_name || "Anonymous"}
                </p>

                {comment.updated_at && !comment.deleted_at && (
                  <p className="mt-1 text-xs text-white/40">Edited</p>
                )}
              </div>

              <p className="text-xs text-white/50">
                {new Date(comment.created_at).toLocaleString()}
              </p>
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

            <div className="mt-5 space-y-4">
              {getReplies(comment.id).map((reply) => (
                <div
                  key={reply.id}
                  className="ml-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">
                        {reply.author_name || "Anonymous"}
                      </p>

                      {reply.updated_at && !reply.deleted_at && (
                        <p className="mt-1 text-xs text-white/40">Edited</p>
                      )}
                    </div>

                    <p className="text-xs text-white/50">
                      {new Date(reply.created_at).toLocaleString()}
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

            {!comment.deleted_at && (
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
