// src/app/profile/[id]/page.js

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getPlan(profile) {
  return profile?.plan || profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  return ["premium", "vip"].includes(getPlan(profile));
}

function getGallery(profile) {
  const gallery = profile?.gallery_urls || profile?.photos || profile?.photo_urls || [];
  return Array.isArray(gallery) ? gallery.filter(Boolean) : [];
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id;

  const [viewerProfile, setViewerProfile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

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
    async function loadProfile() {
      if (!profileId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: currentProfile, error: viewerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (viewerError) {
        alert(viewerError.message);
        router.push("/dashboard");
        return;
      }

      const { data: viewedProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError || !viewedProfile) {
        router.push("/browse");
        return;
      }

      const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("liked_user_id", profileId)
        .maybeSingle();

      setViewerProfile(currentProfile);
      setProfile(viewedProfile);
      setLiked(Boolean(existingLike));
      setLoading(false);
    }

    loadProfile();
  }, [profileId, router]);

  async function handleLike() {
    if (liked || !profile?.id) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase.from("likes").insert({
      user_id: user.id,
      liked_user_id: profile.id,
    });

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        setLiked(true);
        return;
      }

      alert(error.message);
      return;
    }

    setLiked(true);
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading profile...</p>
        </main>
      </>
    );
  }

  const fullAccess = hasPremiumAccess(viewerProfile);
  const gallery = getGallery(profile);

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen select-none bg-[#b30018] px-6 pb-24 pt-16 text-white">
        <section className="mx-auto max-w-6xl">
          <Link href="/browse" className="font-bold text-white/75 hover:text-white">
            ← Back to Browse
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden rounded-[3rem] bg-black/25 shadow-2xl">
              <img
                src={profile?.avatar_url || "/placeholder-profile.jpg"}
                alt={fullAccess ? profile?.full_name || "Profile" : "Locked profile photo"}
                draggable="false"
                onContextMenu={(event) => event.preventDefault()}
                className="pointer-events-none h-[75vh] w-full object-cover object-top"
              />

              {!fullAccess && (
                <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] border border-white/20 bg-black/65 p-5 text-center backdrop-blur-xl">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">
                    Profile Locked
                  </p>
                  <p className="mt-2 text-white/80">
                    Upgrade to unlock member details.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                Matchups Profile
              </p>

              {!fullAccess ? (
                <LockedProfile />
              ) : (
                <FullProfile
                  profile={profile}
                  gallery={gallery}
                  liked={liked}
                  handleLike={handleLike}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function LockedProfile() {
  return (
    <div className="mt-10 rounded-[2rem] border border-white/15 bg-black/20 p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">
        🔒
      </div>

      <h1 className="font-display mt-6 text-5xl font-bold">
        Upgrade to unlock this profile
      </h1>

      <p className="mt-5 text-lg leading-8 text-white/75">
        Free members can view profile photos only. Upgrade to Premium or VIP to
        unlock names, full details, gallery, likes, and messaging.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/matchups/checkout?plan=premium"
          className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
        >
          Upgrade to Premium
        </Link>

        <Link
          href="/matchups/checkout?plan=vip"
          className="rounded-full bg-yellow-300 px-8 py-4 text-center font-black text-black transition hover:scale-105"
        >
          Become VIP
        </Link>
      </div>

      <p className="mt-6 text-sm leading-6 text-white/55">
        Screenshotting, copying, saving, or redistributing member photos is not
        permitted.
      </p>
    </div>
  );
}

function FullProfile({ profile, gallery, liked, handleLike }) {
  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display mt-5 text-6xl font-bold">
            {profile?.full_name || "Member"}
          </h1>

          <p className="mt-4 text-lg text-white/75">
            {[profile?.age, profile?.city, profile?.country].filter(Boolean).join(" • ") ||
              "Profile details not added"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLike}
          className={`rounded-full px-6 py-4 font-black transition hover:scale-105 ${
            liked ? "bg-red-700 text-white" : "bg-white text-[#b30018]"
          }`}
        >
          {liked ? "♥ Liked" : "♡ Like"}
        </button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Info label="Age" value={profile?.age || "Not added"} />
        <Info label="Gender" value={profile?.gender || "Not added"} />
        <Info label="Country" value={profile?.country || "Not added"} />
        <Info label="City" value={profile?.city || "Not added"} />
        <Info label="Occupation" value={profile?.occupation || "Not added"} />
        <Info
          label="Religious Background"
          value={
            profile?.religious_background ||
            profile?.faith_background ||
            "Not added"
          }
        />
        <Info label="Genotype" value={profile?.genotype || "Not added"} />
        <Info label="Height" value={profile?.height || "Not added"} />
      </div>

      <div className="mt-10 space-y-8">
        <ProfileSection title="About" value={profile?.bio || "No bio added yet."} />
        <ProfileSection title="Interests" value={profile?.interests || "Not added"} />
        <ProfileSection
          title="Relationship Goal"
          value={profile?.relationship_goal || "Not added"}
        />
      </div>

      {gallery.length > 0 && (
        <div className="mt-10">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
            Gallery
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {gallery.map((image) => (
              <img
                key={image}
                src={image}
                alt="Profile gallery"
                draggable="false"
                onContextMenu={(event) => event.preventDefault()}
                className="pointer-events-none h-72 rounded-[2rem] object-cover object-top"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href={`/chat/${profile.id}`}
          className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
        >
          Send Message
        </Link>

        <Link
          href="/browse"
          className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-center font-black text-white transition hover:bg-white/20"
        >
          Continue Browsing
        </Link>
      </div>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-red-100">
        {label}
      </p>
      <p className="mt-3 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ProfileSection({ title, value }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {title}
      </p>
      <p className="mt-3 text-lg leading-8 text-white/80">{value}</p>
    </div>
  );
}
