"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

function getPlan(profile) {
  return profile?.plan || profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  const plan = getPlan(profile);
  return plan === "premium" || plan === "vip";
}

function isVip(profile) {
  return getPlan(profile) === "vip";
}

export default function LikesPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [likedByProfiles, setLikedByProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLikesPage() {
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

      setUserProfile(profile);

      if (!hasPremiumAccess(profile)) {
        setLoading(false);
        return;
      }

      const { data: likes, error } = await supabase
        .from("likes")
        .select("user_id")
        .eq("liked_user_id", user.id);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const likerIds = (likes || []).map((like) => like.user_id);

      if (likerIds.length === 0) {
        setLikedByProfiles([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", likerIds);

      if (profilesError) {
        alert(profilesError.message);
      } else {
        setLikedByProfiles(profiles || []);
      }

      setLoading(false);
    }

    loadLikesPage();
  }, []);

  const hasFullAccess = hasPremiumAccess(userProfile);

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading likes...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-20 pt-36 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.4em] text-red-100">
              Likes
            </p>

            <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
              Who Liked You
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/75">
              Discover members who have shown interest in your Delly&apos;s
              Matchups profile.
            </p>
          </div>

          {!hasFullAccess ? (
            <section className="mt-14 rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-14">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl">
                🔒
              </div>

              <h2 className="font-display mt-8 text-5xl font-bold">
                Likes are a Premium feature
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
                You can browse profiles freely. Upgrade when you are ready to
                see who liked you and start meaningful conversations.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/browse"
                  className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-center font-black text-white transition hover:bg-white/20"
                >
                  Browse Profiles
                </a>

                <a
                  href="/matchups/checkout"
                  className="rounded-full bg-white px-10 py-5 text-center font-black text-[#b30018] transition hover:scale-105"
                >
                  Upgrade To See Likes
                </a>
              </div>
            </section>
          ) : likedByProfiles.length === 0 ? (
            <section className="mt-14 rounded-[3rem] bg-[#c1121f] p-10 text-center shadow-2xl">
              <h2 className="font-display text-5xl font-bold">
                No Likes Yet
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-white/75">
                Keep your profile polished and continue browsing to increase
                visibility.
              </p>

              <a
                href="/browse"
                className="mt-10 inline-block rounded-full bg-white px-10 py-5 font-black text-[#b30018] transition hover:scale-105"
              >
                Browse Matchups
              </a>
            </section>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {likedByProfiles.map((profile, index) => {
                const vipProfile = isVip(profile);

                return (
                  <motion.article
                    key={profile.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`overflow-hidden rounded-[2.5rem] shadow-2xl transition hover:-translate-y-2 ${
                      vipProfile ? "bg-yellow-400/15" : "bg-[#c1121f]"
                    }`}
                  >
                    <a href={`/profile/${profile.id}`} className="block">
                      <div className="relative">
                        <img
                          src={profile.avatar_url || "/placeholder-profile.jpg"}
                          alt={profile.full_name || "Member"}
                          className="h-[420px] w-full object-cover object-top"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                        {vipProfile && (
                          <span className="absolute left-5 top-5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                            👑 VIP
                          </span>
                        )}

                        <div className="absolute bottom-6 left-6">
                          <h2 className="font-display text-4xl font-bold">
                            {profile.full_name || "Unnamed Member"}
                          </h2>

                          <p className="mt-2 text-white/75">
                            {profile.age || "Age not added"} •{" "}
                            {profile.city || "City not added"}
                          </p>
                        </div>
                      </div>
                    </a>

                    <div className="p-8">
                      <p className="line-clamp-4 text-lg leading-8 text-white/75">
                        {profile.bio || "No bio added yet."}
                      </p>

                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <a
                          href={`/profile/${profile.id}`}
                          className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-center font-black text-white transition hover:bg-white/20"
                        >
                          View Profile
                        </a>

                        <a
                          href={`/chat/${profile.id}`}
                          className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
                        >
                          Message
                        </a>
                      </div>
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
