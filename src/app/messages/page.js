"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

function getPlan(profile) {
  return profile?.plan || profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  const plan = getPlan(profile);
  return plan === "premium" || plan === "vip";
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const premiumAccess = hasPremiumAccess(profile);
      setHasFullAccess(premiumAccess);

      if (!premiumAccess) {
        setLoading(false);
        return;
      }

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const conversationMap = new Map();

      for (const message of messages || []) {
        const otherUserId =
          message.sender_id === user.id ? message.receiver_id : message.sender_id;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            lastMessage: message.content,
            createdAt: message.created_at,
            unread: message.receiver_id === user.id && message.is_read === false,
          });
        }
      }

      const userIds = Array.from(conversationMap.keys());

      if (userIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        alert(profilesError.message);
        setLoading(false);
        return;
      }

      const finalConversations = userIds.map((id) => ({
        ...conversationMap.get(id),
        profile: profiles.find((profile) => profile.id === id),
      }));

      setConversations(finalConversations);
      setLoading(false);
    }

    loadMessages();
  }, []);

  function formatDate(date) {
    return new Date(date).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading messages...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-20 pt-36 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
            Messages
          </p>

          <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
            Your Conversations
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Continue meaningful conversations with your Delly&apos;s Matchups
            connections.
          </p>

          {!hasFullAccess ? (
            <div className="mt-14 rounded-[3rem] bg-[#c1121f] p-12 text-center shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                Messaging is a Premium feature
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-white/75">
                You can browse profiles freely. Upgrade when you are ready to
                start private conversations.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="/browse"
                  className="rounded-full border border-white/20 bg-white/10 px-10 py-5 font-black text-white transition hover:bg-white/20"
                >
                  Browse Profiles
                </a>

                <a
                  href="/matchups/checkout"
                  className="rounded-full bg-white px-10 py-5 font-black text-[#b30018] transition hover:scale-105"
                >
                  Upgrade To Message
                </a>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="mt-14 rounded-[3rem] bg-[#c1121f] p-12 text-center shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                No Messages Yet
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-white/75">
                Browse matchups and connect with members to begin a conversation.
              </p>

              <a
                href="/browse"
                className="mt-10 inline-block rounded-full bg-white px-10 py-5 font-black text-[#b30018] transition hover:scale-105"
              >
                Browse Matchups
              </a>
            </div>
          ) : (
            <div className="mt-14 space-y-5">
              {conversations.map((conversation) => (
                <a
                  key={conversation.userId}
                  href={`/chat/${conversation.userId}`}
                  className="flex items-center gap-5 rounded-[2rem] bg-[#c1121f] p-5 shadow-2xl transition hover:-translate-y-1"
                >
                  <img
                    src={
                      conversation.profile?.avatar_url ||
                      "/placeholder-profile.jpg"
                    }
                    alt={conversation.profile?.full_name || "Member"}
                    className="h-20 w-20 rounded-full object-cover object-top"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="truncate text-2xl font-black">
                        {conversation.profile?.full_name || "Member"}
                      </h2>

                      <p className="shrink-0 text-sm text-white/60">
                        {formatDate(conversation.createdAt)}
                      </p>
                    </div>

                    <p className="mt-2 truncate text-white/70">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {conversation.unread && (
                    <span className="h-4 w-4 rounded-full bg-white" />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
