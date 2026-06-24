"use client";

import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getPlan(profile) {
  return profile?.plan || profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  const plan = getPlan(profile);
  return plan === "premium" || plan === "vip";
}

export default function PublicProfilePage({ params }) {
  const [viewerProfile, setViewerProfile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
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

      const { data: viewedProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !viewedProfile) {
        window.location.href = "/browse";
        return;
      }

      setViewerProfile(currentProfile);
      setProfile(viewedProfile);
      setLoading(false);
    }

    loadProfile();
  }, [params.id]);

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

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-16 text-white">
        <section className="mx-auto max-w-6xl">
          <a href="/browse" className="font-bold text-white/75 hover:text-white">
            ← Back to Browse
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[3rem] bg-black/25 shadow-2xl">
              <img
                src={profile?.avatar_url || "/placeholder-profile.jpg"}
                alt={profile?.full_name || "Profile"}
                className="h-[75vh] w-full object-cover object-top"
              />
            </div>

            <div className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                Matchups Profile
              </p>

              <h1 className="font-display mt-5 text-6xl font-bold">
                {profile?.full_name || "Member"}
              </h1>

              <p className="mt-4 text-lg text-white/75">
                {fullAccess
                  ? [profile?.age, profile?.city, profile?.country].filter(Boolean).join(" • ") ||
                    "Profile details not added"
                  : profile?.country || "Location available after upgrade"}
              </p>

              <div className="mt-10 space-y-8">
                <ProfileSection title="About" value={profile?.bio || "No bio added yet."} />

                <ProfileSection
                  title="Interests"
                  value={profile?.interests || "Not added"}
                  locked={!fullAccess}
                />

                <ProfileSection
                  title="Relationship Goal"
                  value={profile?.relationship_goal || "Not added"}
                  locked={!fullAccess}
                />

                <ProfileSection
                  title="Faith Background"
                  value={profile?.faith_background || "Not added"}
                  locked={!fullAccess}
                />
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {fullAccess ? (
                  <a
                    href={`/chat/${profile.id}`}
                    className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
                  >
                    Send Message
                  </a>
                ) : (
                  <a
                    href="/matchups/checkout"
                    className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
                  >
                    Upgrade to Message
                  </a>
                )}

                {!fullAccess && (
                  <a
                    href="/matchups/checkout"
                    className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-center font-black text-white transition hover:bg-white/20"
                  >
                    Unlock Full Profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function ProfileSection({ title, value, locked = false }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {title}
      </p>
      <p className={`mt-3 text-lg leading-8 text-white/80 ${locked ? "select-none blur-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}
