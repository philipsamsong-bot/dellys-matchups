"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

const emojis = ["😊", "❤️", "😂", "🙏", "🔥", "😍"];

function getPlan(profile) {
  return profile?.plan || profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  const plan = getPlan(profile);
  return plan === "premium" || plan === "vip";
}

export default function ChatPage() {
  const { userId } = useParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [receiverProfile, setReceiverProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  const hasAccess = useMemo(
    () => hasPremiumAccess(currentProfile),
    [currentProfile]
  );

  useEffect(() => {
    async function loadChat() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      setCurrentUser(user);

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!hasPremiumAccess(myProfile)) {
        window.location.href = "/matchups/checkout";
        return;
      }

      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: chatMessages } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", userId)
        .eq("is_read", false);

      const { data: conversationMessages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const conversationUserIds = [
        ...new Set(
          (conversationMessages || []).map((msg) =>
            msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
          )
        ),
      ];

      let conversationProfiles = [];

      if (conversationUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", conversationUserIds);

        conversationProfiles = profiles || [];
      }

      setCurrentProfile(myProfile);
      setReceiverProfile(otherProfile);
      setMessages(chatMessages || []);
      setConversations(conversationProfiles);
      setLoading(false);
    }

    loadChat();
  }, [userId]);

  useEffect(() => {
    if (!currentUser || !userId) return;

    const channel = supabase
      .channel(`messages-${currentUser.id}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new;

          const belongsToChat =
            (newMessage.sender_id === currentUser.id &&
              newMessage.receiver_id === userId) ||
            (newMessage.sender_id === userId &&
              newMessage.receiver_id === currentUser.id);

          if (!belongsToChat) return;

          setMessages((current) => {
            const alreadyExists = current.some((msg) => msg.id === newMessage.id);
            return alreadyExists ? current : [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();

    if (!message.trim() || sending) return;

    const text = message.trim();
    setMessage("");
    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: userId,
        content: text,
        is_read: false,
      })
      .select("*")
      .single();

    setSending(false);

    if (error) {
      alert(error.message);
      setMessage(text);
      return;
    }

    setMessages((current) => {
      const alreadyExists = current.some((msg) => msg.id === data.id);
      return alreadyExists ? current : [...current, data];
    });
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading chat...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] pt-28 text-white">
        <div className="grid min-h-[calc(100vh-7rem)] grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_320px]">
          <aside className="hidden border-r border-white/10 bg-[#7a0010]/60 lg:block">
            <div className="border-b border-white/10 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                Messages
              </p>
              <h2 className="mt-3 font-serif text-4xl font-black">Chats</h2>
            </div>

            <div className="space-y-3 p-4">
              {conversations.length === 0 ? (
                <div className="rounded-2xl bg-white/10 p-5 text-white/60">
                  No conversations yet.
                </div>
              ) : (
                conversations.map((profile) => {
                  const isActive = profile.id === userId;

                  return (
                    <a
                      key={profile.id}
                      href={`/chat/${profile.id}`}
                      className={`flex items-center gap-4 rounded-2xl p-4 transition ${
                        isActive
                          ? "bg-white text-[#b30018]"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      <img
                        src={profile.avatar_url || "/placeholder-profile.jpg"}
                        alt={profile.full_name || "Member"}
                        className="h-14 w-14 rounded-full object-cover object-top"
                      />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold">
                          {profile.full_name || "Member"}
                        </h3>
                        <p
                          className={`truncate text-sm ${
                            isActive ? "text-[#b30018]/70" : "text-white/60"
                          }`}
                        >
                          {profile.city || "Delly's Matchups"}
                        </p>
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[calc(100vh-7rem)] flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#7a0010]/50 px-5 py-4 backdrop-blur-xl">
              <a
                href={`/profile/${receiverProfile?.id}`}
                className="flex items-center gap-4"
              >
                <img
                  src={receiverProfile?.avatar_url || "/placeholder-profile.jpg"}
                  alt={receiverProfile?.full_name || "Member"}
                  className="h-14 w-14 rounded-full object-cover object-top"
                />

                <div>
                  <h1 className="font-serif text-2xl font-black">
                    {receiverProfile?.full_name || "Member"}
                  </h1>
                  <p className="text-sm text-white/60">
                    {receiverProfile?.city || "Delly's Matchups member"}
                  </p>
                </div>
              </a>

              <a
                href="/browse"
                className="rounded-full bg-white px-5 py-3 font-black text-[#b30018] transition hover:scale-105"
              >
                Browse
              </a>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-[2rem] border border-white/10 bg-white/10 p-10 text-center">
                    <p className="text-xl text-white/80">No messages yet.</p>
                    <p className="mt-3 text-white/50">
                      Start the conversation respectfully.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((chat) => {
                    const isMine = chat.sender_id === currentUser.id;

                    return (
                      <div
                        key={chat.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div>
                          <div
                            className={`max-w-[80vw] rounded-[2rem] px-5 py-4 shadow-xl md:max-w-md ${
                              isMine
                                ? "bg-white text-[#b30018]"
                                : "bg-[#7a0010]/70 text-white"
                            }`}
                          >
                            <p className="leading-relaxed">{chat.content}</p>
                          </div>
                          <p
                            className={`mt-1 text-xs text-white/45 ${
                              isMine ? "text-right" : "text-left"
                            }`}
                          >
                            {formatTime(chat.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {hasAccess && (
              <form
                onSubmit={sendMessage}
                className="border-t border-white/10 bg-[#7a0010]/50 p-4 backdrop-blur-xl"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMessage((current) => current + emoji)}
                      className="rounded-full bg-white/10 px-3 py-2 text-lg transition hover:bg-white hover:text-[#b30018]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write a thoughtful message..."
                    className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/50"
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-2xl bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="hidden border-l border-white/10 bg-[#7a0010]/60 p-6 xl:block">
            <a
              href={`/profile/${receiverProfile?.id}`}
              className="block rounded-[2rem] border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <img
                src={receiverProfile?.avatar_url || "/placeholder-profile.jpg"}
                alt={receiverProfile?.full_name || "Member"}
                className="h-72 w-full rounded-[1.5rem] object-cover object-top"
              />

              <h2 className="mt-5 font-serif text-3xl font-black">
                {receiverProfile?.full_name || "Member"}
              </h2>

              <p className="mt-1 text-white/70">
                {receiverProfile?.age || "Age not added"} •{" "}
                {receiverProfile?.city || "City not added"}
              </p>

              <p className="mt-4 text-sm leading-7 text-white/75">
                {receiverProfile?.bio || "No bio added yet."}
              </p>

              <p className="mt-4 text-sm text-red-100">
                {receiverProfile?.interests || "No interests added."}
              </p>
            </a>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => alert("Report feature coming soon.")}
                className="rounded-2xl border border-white/15 py-3 font-bold text-white/80 transition hover:bg-white hover:text-[#b30018]"
              >
                Report
              </button>

              <button
                type="button"
                onClick={() => alert("Block feature coming soon.")}
                className="rounded-2xl border border-white/15 py-3 font-bold text-white/80 transition hover:bg-white hover:text-[#b30018]"
              >
                Block
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
