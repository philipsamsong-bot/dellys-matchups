"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

function getPlan(profile) {
  return (
    profile?.plan ||
    profile?.membership_plan ||
    profile?.subscription ||
    "free"
  )?.toLowerCase();
}

function hasPremiumAccess(profile) {
  return ["premium", "vip"].includes(getPlan(profile));
}

function isVip(profile) {
  return getPlan(profile) === "vip";
}

function getDisplayLocation(profile) {
  return [profile?.city, profile?.country].filter(Boolean).join(", ") || "Location not added";
}

function getProfileScore(profile) {
  let score = 0;

  if (profile?.avatar_url) score += 50;
  if (profile?.is_complete) score += 40;
  if (isVip(profile)) score += 30;
  if (getPlan(profile) === "premium") score += 20;

  return score;
}

export default function BrowsePage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  const [locationFilter, setLocationFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [minAgeFilter, setMinAgeFilter] = useState("");
  const [maxAgeFilter, setMaxAgeFilter] = useState("");

  useEffect(() => {
    function blockCopy(event) {
      event.preventDefault();
    }

    document.addEventListener("contextmenu", blockCopy);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    document.addEventListener("dragstart", blockCopy);

    return () => {
      document.removeEventListener("contextmenu", blockCopy);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      document.removeEventListener("dragstart", blockCopy);
    };
  }, []);

  useEffect(() => {
    async function loadBrowseData() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setUserProfile(currentProfile);

      const { data: profileRows, count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .neq("id", user.id);

      if (error) {
        console.error("Failed to load profiles:", error);
        setProfiles([]);
        setTotalMembers(0);
        setLoading(false);
        return;
      }

      const sortedProfiles = (profileRows || []).sort((a, b) => {
        return getProfileScore(b) - getProfileScore(a);
      });

      setProfiles(sortedProfiles);
      setTotalMembers(count ?? sortedProfiles.length);

      const { data: likes } = await supabase
        .from("profile_likes")
        .select("liked_profile_id")
        .eq("user_id", user.id);

      setLikedProfiles((likes || []).map((like) => like.liked_profile_id));

      setLoading(false);
    }

    loadBrowseData();
  }, [router]);

  const hasFullAccess = hasPremiumAccess(userProfile);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const location = getDisplayLocation(profile).toLowerCase();
      const gender = profile?.gender || "";
      const age = Number(profile?.age || 0);

      const matchesLocation =
        !locationFilter ||
        location.includes(locationFilter.trim().toLowerCase());

      const matchesGender = !genderFilter || gender === genderFilter;

      const matchesMinAge =
        !minAgeFilter || (age && age >= Number(minAgeFilter));

      const matchesMaxAge =
        !maxAgeFilter || (age && age <= Number(maxAgeFilter));

      return matchesLocation && matchesGender && matchesMinAge && matchesMaxAge;
    });
  }, [profiles, locationFilter, genderFilter, minAgeFilter, maxAgeFilter]);

  async function handleLike(profileId) {
    if (!userProfile?.id) return;

    const alreadyLiked = likedProfiles.includes(profileId);

    if (alreadyLiked) {
      setLikedProfiles((current) => current.filter((id) => id !== profileId));

      await supabase
        .from("profile_likes")
        .delete()
        .eq("user_id", userProfile.id)
        .eq("liked_profile_id", profileId);

      return;
    }

    setLikedProfiles((current) => [...current, profileId]);

    await supabase.from("profile_likes").insert({
      user_id: userProfile.id,
      liked_profile_id: profileId,
    });
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="min-h-screen bg-[#b30018] px-6 py-24 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-200">
              Browse Matchups
            </p>
            <h1 className="mt-6 font-display text-5xl font-black md:text-7xl">
              Loading profiles...
            </h1>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-gradient-to-b from-[#b30018] via-[#cf001c] to-[#7a000d] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
              Browse Matchups
            </p>

            <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-tight md:text-7xl">
              Discover Your
              <br />
              Meaningful Match
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
              Browse profile photos. Upgrade to unlock full profiles, galleries,
              likes, and direct messaging.
            </p>
          </motion.div>

          <div className="mt-10 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-200">
                Active Members
              </p>
              <h2 className="mt-2 text-5xl font-black">
                {totalMembers.toLocaleString()}
              </h2>
            </div>

            <div className="md:text-right">
              <p className="font-bold text-white/80">
                Completed profiles with photos appear first.
              </p>
              <p className="mt-1 text-sm text-white/60">
                {hasFullAccess
                  ? "Full access unlocked"
                  : "Free members see photos only. Upgrade to unlock details."}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:grid-cols-4">
            <input
              type="text"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              placeholder="Search location"
              className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-white/50"
            />

            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none"
            >
              <option value="" className="text-black">
                All genders
              </option>
              <option value="Man" className="text-black">
                Man
              </option>
              <option value="Woman" className="text-black">
                Woman
              </option>
              <option value="Prefer not to say" className="text-black">
                Prefer not to say
              </option>
            </select>

            <input
              type="number"
              min="18"
              value={minAgeFilter}
              onChange={(event) => setMinAgeFilter(event.target.value)}
              placeholder="Min age"
              className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-white/50"
            />

            <input
              type="number"
              min="18"
              value={maxAgeFilter}
              onChange={(event) => setMaxAgeFilter(event.target.value)}
              placeholder="Max age"
              className="h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none placeholder:text-white/50"
            />
          </div>

          {!hasFullAccess && (
            <div className="mt-8 rounded-[2rem] border border-yellow-300/30 bg-black/25 p-6">
              <p className="font-black uppercase tracking-[0.25em] text-yellow-300">
                Privacy Notice
              </p>
              <p className="mt-3 text-white/75">
                Member details are private. Free users can view profile photos
                only. Screenshots, copying, saving, or redistributing member
                images is not permitted.
              </p>
            </div>
          )}

          {filteredProfiles.length === 0 ? (
            <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-white/70">
              No profiles found.
            </div>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProfiles.map((profile, index) => {
                const vipProfile = isVip(profile);
                const premiumProfile = getPlan(profile) === "premium";
                const isLiked = likedProfiles.includes(profile.id);
                const profileHref = `/profile/${profile.id}`;

                return (
                  <motion.article
                    key={profile.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group overflow-hidden rounded-[3rem] border shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.01] ${
                      vipProfile
                        ? "border-yellow-400 bg-gradient-to-b from-yellow-500/20 via-[#4d0008] to-black shadow-[0_0_60px_rgba(250,204,21,0.35)]"
                        : premiumProfile
                          ? "border-red-300/40 bg-gradient-to-b from-red-500/20 to-[#3d0008]"
                          : "border-white/10 bg-gradient-to-b from-white/10 to-[#3d0008]"
                    }`}
                  >
                    <div className="relative overflow-hidden">
                      <Link href={profileHref} className="block">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={
                              hasFullAccess
                                ? profile.full_name || "Member profile photo"
                                : "Locked member profile photo"
                            }
                            draggable="false"
                            onContextMenu={(event) => event.preventDefault()}
                            className="pointer-events-none h-[440px] w-full object-cover object-top transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-[440px] items-center justify-center bg-black/30 text-white/40">
                            No Photo
                          </div>
                        )}
                      </Link>

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      {hasFullAccess && (
                        <button
                          type="button"
                          onClick={() => handleLike(profile.id)}
                          className={`absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-2xl transition ${
                            isLiked
                              ? "bg-red-700 text-white"
                              : "bg-black/60 text-white hover:bg-red-700"
                          }`}
                        >
                          {isLiked ? "♥" : "♡"}
                        </button>
                      )}

                      {hasFullAccess && vipProfile && (
                        <div className="absolute left-5 top-5 z-20 rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                          👑 VIP
                        </div>
                      )}

                      {hasFullAccess && premiumProfile && !vipProfile && (
                        <div className="absolute left-5 top-5 z-20 rounded-full bg-white px-4 py-2 text-sm font-black text-[#b30018]">
                          Premium
                        </div>
                      )}

                      {hasFullAccess && profile.is_complete && (
                        <div className="absolute left-5 top-16 z-20 rounded-full bg-green-600 px-4 py-2 text-xs font-black uppercase">
                          ✓ Complete Profile
                        </div>
                      )}

                      {hasFullAccess ? (
                        <div className="pointer-events-none absolute bottom-6 left-6 right-6">
                          <h2 className="font-display text-4xl font-black">
                            {profile.full_name || "Unnamed Member"}
                          </h2>
                          <p className="mt-2 text-white/75">
                            {profile.age || "Age not added"} •{" "}
                            {getDisplayLocation(profile)}
                          </p>
                        </div>
                      ) : (
                        <div className="pointer-events-none absolute bottom-6 left-6 right-6 rounded-[2rem] border border-white/15 bg-black/60 p-5 text-center backdrop-blur-xl">
                          <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">
                            Profile Locked
                          </p>
                          <p className="mt-2 text-white/75">
                            Upgrade to unlock details.
                          </p>
                        </div>
                      )}
                    </div>

                    {hasFullAccess ? (
                      <div className="flex min-h-[320px] flex-col p-7">
                        <div className="space-y-5">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-red-200">
                              About
                            </p>
                            <p className="mt-2 line-clamp-4 text-white/80">
                              {profile.bio ||
                                "This member has not added a biography yet."}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-red-200">
                              Interests
                            </p>
                            <p className="mt-2 text-white/75">
                              {profile.interests || "Interests not added"}
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
                        </div>

                        <div className="mt-auto grid gap-4 pt-8">
                          <Link
                            href={profileHref}
                            className="block w-full rounded-2xl bg-white px-6 py-4 text-center font-bold text-[#b30018] transition hover:scale-[1.02]"
                          >
                            View Profile
                          </Link>

                          <Link
                            href={`/chat/${profile.id}`}
                            className="block w-full rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center font-bold text-white transition hover:bg-white/20"
                          >
                            Message
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-7">
                        <Link
                          href="/matchups/checkout?plan=premium"
                          className="block w-full rounded-2xl bg-white px-6 py-4 text-center font-bold text-[#b30018] transition hover:scale-[1.02]"
                        >
                          Upgrade to Unlock Profile
                        </Link>
                      </div>
                    )}
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
