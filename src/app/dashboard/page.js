"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

function getCompletionPercentage(profile) {
  if (!profile) return 0;

  const fields = [
    profile.avatar_url,
    profile.age,
    profile.gender,
    profile.city,
    profile.bio,
    profile.interests,
    profile.relationship_goal,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function getPlan(profile) {
  return profile?.membership_plan || profile?.subscription || "free";
}

function hasPremiumAccess(profile) {
  const plan = getPlan(profile);
  return plan === "premium" || plan === "vip";
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [suggestedProfiles, setSuggestedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { count: likesTotal } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("liked_user_id", user.id);

      const { count: unreadTotal } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

        const {data: suggestedData} =await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .eq("is_visible", true)
        .limit(3);

      setProfile(profileData);
      setLikesCount(likesTotal || 0);
      setMessagesCount(unreadTotal || 0);
      setSuggestedProfiles(suggestedData || []);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
        <p className="text-xl font-bold">Loading dashboard...</p>
      </main>
    );
  }

  const plan = getPlan(profile);
  const premiumAccess = hasPremiumAccess(profile);
  const completionPercentage = getCompletionPercentage(profile);
  const hasFullAccess = profile?.membership_plan === "premium" || profile?.membership_plan === "vip";

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-12 text-white">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                Dashboard
              </p>

              <h1 className="font-display mt-5 text-6xl font-bold leading-none md:text-7xl">
                Welcome Back
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                Continue your luxury matchmaking journey and discover meaningful
                intentional connections.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
            >
              Logout
            </button>
          </motion.div>

          <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="rounded-[3rem] bg-[#c1121f] p-8 text-center shadow-2xl"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="mx-auto h-48 w-48 rounded-full border-4 border-white object-cover object-top shadow-2xl"
                />
              ) : (
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                  No Image
                </div>
              )}

              <h2 className="font-display mt-8 text-5xl font-bold">
                {profile?.full_name || "My Profile"}
              </h2>

              <p className="mt-3 text-white/70">
                {profile?.city || "City not added"}
              </p>

              <div className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#b30018]">
                {plan} Member
              </div>

              <div className="mt-8 text-left">
                <div className="mb-3 flex justify-between text-sm font-bold">
                  <span>Profile Completion</span>
                  <span>{completionPercentage}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/10 p-6">
  <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
    Your Plan
  </p>

  <h3 className="mt-4 text-2xl font-black uppercase">
    {profile?.membership_plan || "Free"}
  </h3>

  <div className="mt-6 space-y-3 text-white/90">
    <p>✓ Browse Members</p>
    <p>✓ Like Profiles</p>
    <p>✓ Receive Notifications</p>

    <p className={hasFullAccess ? "text-green-300" : "text-white/50"}>
      {hasFullAccess ? "✓" : "🔒"} Direct Messaging
    </p>

    <p className={hasFullAccess ? "text-green-300" : "text-white/50"}>
      {hasFullAccess ? "✓" : "🔒"} See Who Liked You
    </p>

    <p className={hasFullAccess ? "text-green-300" : "text-white/50"}>
      {hasFullAccess ? "✓" : "🔒"} View Full Profiles
    </p>

    <p className={hasFullAccess ? "text-green-300" : "text-white/50"}>
      {hasFullAccess ? "✓" : "🔒"} Upload More Photos
    </p>

    <p className={hasFullAccess ? "text-green-300" : "text-white/50"}>
      {hasFullAccess ? "✓" : "🔒"} Connect With Members
    </p>

    <p
      className={
        profile?.membership_plan === "vip"
          ? "text-yellow-300"
          : "text-white/50"
      }
    >
      {profile?.membership_plan === "vip" ? "✓" : "🔒"} VIP Access
    </p>
  </div>

  {!hasFullAccess && (
    <a
      href="/pricing"
      className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-black text-[#b30018]"
    >
      Upgrade Now
    </a>
  )}
 

</div>

              <a
                href="/profile/setup"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
              >
                Edit Profile
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
            >
              <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                Profile Summary
              </p>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <Info label="Age" value={profile?.age || "Not Added"} />
                <Info label="Gender" value={profile?.gender || "Not Added"} />
                <Info label="City" value={profile?.city || "Not Added"} />
                <Info
                  label="Interests"
                  value={profile?.interests || "Not Added"}
                />
              </div>

              <div className="mt-8">
                <p className="text-sm uppercase tracking-[0.25em] text-red-100">
                  Bio
                </p>
                <p className="mt-3 text-lg leading-8 text-white/75">
                  {profile?.bio || "No bio added yet."}
                </p>
              </div>

              <div className="mt-8">
                <p className="text-sm uppercase tracking-[0.25em] text-red-100">
                  Relationship Goal
                </p>
                <p className="mt-3 text-lg leading-8 text-white/75">
                  {profile?.relationship_goal || "No relationship goal added."}
                </p>
                <div className="mt-12">
  <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
    Profile Gallery
  </p>

  <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black/10">
    <img
      src={profile?.avatar_url || "/placeholder-profile.jpg"}
      alt="Profile"
      className="h-[70vh] w-full object-cover object-top transition duration-700 hover:scale-105"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
  </div>
</div>

              </div>
            </motion.div>
          </section>

          <section className="mt-14 grid gap-6 md:grid-cols-3">
            <DashboardStat
              title="Likes"
              value={likesCount}
              text={
                premiumAccess
                  ? "People interested in your profile."
                  : "Upgrade to see who liked you."
              }
            />

            <DashboardStat
              title="Messages"
              value={messagesCount}
              text={
                premiumAccess
                  ? "Unread conversations waiting for you."
                  : "Upgrade to unlock messaging."
              }
            />

            <DashboardStat
              title="Subscription"
              value={plan}
              text="Access premium matchmaking experiences and exclusive features."
              isText
            />
          </section>

          <section className="mt-14 rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                  Membership Access
                </p>

                <h2 className="font-display mt-4 text-5xl font-bold">
                  {premiumAccess
                    ? "Premium features unlocked."
                    : "Upgrade to unlock full access."}
                </h2>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
                  Free members can create a profile, upload one photo, browse,
                  like profiles, and receive notifications. Premium members
                  unlock messaging, full profiles, likes visibility, and more
                  photos.
                </p>
              </div>

              <a
                href="/membership"
                className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
              >
                Upgrade Plan
              </a>
            </div>
          </section>

          <section className="mt-14">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                  Quick Actions
                </p>

                <h2 className="font-display mt-4 text-5xl font-bold">
                  Continue Your Journey
                </h2>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <QuickAction href="/browse" title="Browse Matchups" />
              <QuickAction href="/likes" title="Who Liked Me" />
              <QuickAction href="/messages" title="Messages" />
              <QuickAction href="/profile/setup" title="Edit Profile" />
            </div>
          </section>

          {profile?.role === "admin" && (
            <section className="mt-16 rounded-[3rem] bg-white p-8 text-black shadow-2xl md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-[#b30018]">
                Admin Tools
              </p>

              <h2 className="font-display mt-4 text-5xl font-bold">
                Manage Platform
              </h2>

              <div className="mt-8 flex flex-wrap gap-5">
                <a
                  href="/admin/counselling-bookings"
                  className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
                >
                  Counselling Admin
                </a>

                <a
                  href="/admin/shop-orders"
                  className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
                >
                  Shop Admin
                </a>
                 
                 <a
                 href="/admin/articles"
                 className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
                 >
                  Articles Admin
                 </a>
                <a
                  href="/admin/contact-messages"
                  className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
                >
                  Contact Messages
                </a>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-red-100">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function DashboardStat({ title, value, text, isText = false }) {
  return (
    <div className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {title}
      </p>

      <h2
        className={`mt-5 font-black ${
          isText ? "text-4xl uppercase" : "text-6xl"
        }`}
      >
        {value}
      </h2>

      <p className="mt-5 text-white/75">{text}</p>
    </div>
  );
}

function QuickAction({ href, title }) {
  return (
    <a
      href={href}
      className="rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center font-black transition hover:scale-[1.02] hover:bg-white hover:text-[#b30018]"
    >
      {title}
    </a>
  );
}
