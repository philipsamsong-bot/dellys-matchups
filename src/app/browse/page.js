"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

function getPlan(profile) {
  return profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  const plan = getPlan(profile);
  return plan === "premium" || plan === "vip";
}

export default function BrowsePage() {
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    async function loadBrowsePage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: otherProfiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .eq("is_visible", true)
        .order("membership_plan", { ascending: false });

      const { data: likes } = await supabase
        .from("likes")
        .select("liked_user_id")
        .eq("user_id", user.id);

      setUserProfile(currentProfile);
      setProfiles(otherProfiles || []);
      setLikedProfiles((likes || []).map((like) => like.liked_user_id));
      setLoading(false);
    }

    loadBrowsePage();
  }, []);

  const hasFullAccess = hasPremiumAccess(userProfile);

  async function handleLike(profileId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const { error } = await supabase.from("likes").insert({
      user_id: user.id,
      liked_user_id: profileId,
    });

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) return;
      alert(error.message);
      return;
    }

    setLikedProfiles((currentLikes) => [...currentLikes, profileId]);
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading Matchups...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-16 text-white">
       
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-black uppercase tracking-[0.35em] text-red-200">
              Browse Matchups
            </p>

            <h1 className="font-display mt-5 text-6xl font-black leading-tight md:text-7xl">
              Discover Your
              <br />
              Meaningful Match
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/70">
              Connect with intentional singles inside Delly&apos;s luxury
              matchmaking ecosystem.
            </p>
          </motion.div>

          <div className="mt-10 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-200">
                Active Members
              </p>

              <h2 className="mt-2 text-5xl font-black">{profiles.length}</h2>
            </div>

            <div className="md:text-right">
              <p className="font-bold text-white/80">
                Members available to browse
              </p>
              <p className="mt-1 text-sm text-white/60">
                {hasFullAccess
                  ? "Premium access unlocked"
                  : "Upgrade to unlock full profiles and messaging"}
              </p>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-white/70">
              No profiles available yet.
            </div>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile, index) => {
                const plan = getPlan(profile);
                const isVip = plan === "vip";
                const isPremium = plan === "premium";
                const isLiked = likedProfiles.includes(profile.id);

                return (
                  <motion.article
                    key={profile.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group overflow-hidden rounded-[3rem] border shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.01] ${
                      isVip
                        ? "border-yellow-400 bg-gradient-to-b from-yellow-500/20 via-[#4d0008] to-black shadow-[0_0_60px_rgba(250,204,21,0.45)]"
                        : isPremium
                        ? "border-red-300/40 bg-gradient-to-b from-red-500/20 to-[#3d0008]"
                        : "border-white/10 bg-gradient-to-b from-white/10 to-[#3d0008]"
                    }`}
                
                
              
                  >
                    <div className="relative overflow-hidden">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || "Member"}
                          className="h-[440px] w-full object-cover object-top transition duration-700 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-[440px] items-center justify-center bg-black/30 text-white/40">
                          No Photo
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      <button
                        type="button"
                        onClick={() => handleLike(profile.id)}
                        className={`absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl transition ${
                          isLiked
                            ? "bg-red-700 text-white"
                            : "bg-black/60 text-white hover:bg-red-700"
                        }`}
                      >
                        {isLiked ? "♥" : "♡"}
                      </button>

                      {isVip && (
                        <div className="absolute left-5 top-5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                          👑 VIP
                        </div>
                      )}

                      {isPremium && !isVip && (
                        <div className="absolute left-5 top-5 rounded-full bg-red-700 px-4 py-2 text-sm font-black">
                          Premium
                        </div>
                      )}

                      {profile.is_complete && (
                        <div className="absolute left-5 top-16 rounded-full bg-green-600 px-4 py-2 text-xs font-black uppercase">
                          ✓ Verified Profile
                        </div>
                      )}

                      <div className="absolute bottom-6 left-6 right-6">
                        <h2 className="font-display text-4xl font-black">
                          {profile.full_name || "Unnamed Member"}
                        </h2>

                        <p
  className={`mt-2 text-white/75 ${
    !hasFullAccess ? "select-none blur-sm" : ""
  }`}
>
  {profile.age || "Age not added"} • {profile.city || "Unknown City"}
</p>
                      </div>
                    </div>

                    <div className="flex min-h-[320px] flex-col p-7">
                      {!hasFullAccess ? (
                        <>
                          <div className="select-none opacity-70">
                            <p className="line-clamp-4 text-white/80">
                              {profile.bio ||
                                "This member profile is available to premium members."}
                            </p>

                            <p className="mt-4 blur-sm text-sm text-red-200">
                              {profile.interests || "Interests locked."}
                            </p>

                            <p className="mt-4 text-white/70">
                              {profile.relationship_goal ||
                                "Relationship goals locked."}
                            </p>
                          </div>

                          <div className="mt-auto pt-8">
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = "/matchups/checkout";
                              }}
                              className="w-full rounded-2xl bg-white px-6 py-4 font-bold text-[#b30018] transition hover:scale-[1.02]"
                            >
                             Upgrade to View Profile
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                         <div className="space-y-5">
  <div className="flex items-center justify-between">
    <div className="rounded-full bg-red-700/30 px-4 py-2 text-sm font-black">
      ❤ {88 + (index % 10)}% Compatibility
    </div>

    <div
      className={`rounded-full px-4 py-2 text-sm font-black ${
        plan === "vip"
          ? "bg-yellow-500 text-black"
          : plan === "premium"
          ? "bg-white text-[#b30018]"
          : "bg-white/10"
      }`}
    >
      {plan.toUpperCase()}
    </div>
  </div>

  <div>
    <p className="text-xs uppercase tracking-[0.25em] text-red-200">
      About
    </p>

    <p className="mt-2 line-clamp-4 text-white/80">
      {profile.bio || "No biography added yet."}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-[0.25em] text-red-200">
      Interests
    </p>

    <p className="mt-2 text-white/75">
      {profile.interests || "Not added"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase tracking-[0.25em] text-red-200">
      Relationship Goal
    </p>

    <p className="mt-2 text-white/75">
      {profile.relationship_goal || "Not added"}
    </p>
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.25em] text-red-200">
      Photo Access
    </p>

    <p className="mt-2 text-lg font-black">
      {plan === "vip"
        ? "Unlimited Photos"
        : plan === "premium"
        ? "5 Photos Available"
        : "1 Photo Only"}
    </p>
  </div>
</div>

                          <div className="mt-auto pt-8">
                            <a
                              href={`/chat/${profile.id}`}
                              className="block w-full rounded-2xl bg-white px-6 py-4 text-center font-bold text-[#b30018] transition hover:scale-[1.02]"
                            >
                              View Profile
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
