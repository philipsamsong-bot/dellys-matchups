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
    profile.marital_status,
    profile.country,
    profile.city,
    profile.bio,
    profile.interests,
    profile.relationship_goal,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

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

function isMarried(profile) {
  return profile?.marital_status === "Married";
}

function getFirstName(profile, user) {
  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "";

  return fullName.trim().split(" ")[0];
}

function PlanBadge({ profile }) {
  const plan = getPlan(profile);

  if (plan === "vip") {
    return (
      <div className="inline-flex rounded-full bg-gradient-to-r from-yellow-200 via-white to-yellow-400 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-[#7a0010] shadow-2xl">
        👑 VIP Member
      </div>
    );
  }

  if (plan === "premium") {
    return (
      <div className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-[#b30018] shadow-xl">
        ✨ Premium Member
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-white">
      Free Member
    </div>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [welcomeName, setWelcomeName] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [academyCount, setAcademyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        window.location.href = "/profile/setup";
        return;
      }

      const { count: likesTotal } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("liked_user_id", user.id);

      const { count: unreadTotal } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      const { count: academyTotal } = await supabase
        .from("academy_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_email", user.email)
        .eq("status", "active");

      setProfile(profileData);
      setWelcomeName(getFirstName(profileData, user));
      setLikesCount(likesTotal || 0);
      setMessagesCount(unreadTotal || 0);
      setAcademyCount(academyTotal || 0);
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
  const vipAccess = isVip(profile);
  const married = isMarried(profile);
  const completionPercentage = getCompletionPercentage(profile);

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
                {welcomeName ? `Welcome back, ${welcomeName} 👋` : "Welcome Back"}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                Continue your Delly&apos;s Matchups journey through intentional
                relationships, counselling, mentorship, and growth.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
            >
              Logout
            </button>
          </motion.div>

          {married && (
            <section className="mt-10 rounded-[2rem] border border-yellow-200/40 bg-yellow-100 p-6 text-black shadow-2xl">
              <p className="font-black uppercase tracking-[0.25em] text-[#7a0010]">
                Matchups Restricted
              </p>
              <p className="mt-3 leading-7">
                Married users are not eligible to create or use Matchups
                profiles. You may still access The Academy, counselling, shop,
                articles, and other Delly&apos;s Matchups resources.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <a
                  href="/about/academy"
                  className="rounded-full bg-[#b30018] px-6 py-3 font-black text-white"
                >
                  Visit The Academy
                </a>
                <a
                  href="/counselling"
                  className="rounded-full border border-[#b30018]/30 px-6 py-3 font-black text-[#b30018]"
                >
                  Book Counselling
                </a>
              </div>
            </section>
          )}

          <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className={`rounded-[3rem] p-8 text-center shadow-2xl ${
                vipAccess
                  ? "border border-yellow-200/60 bg-gradient-to-br from-[#4a0008] via-[#9b0016] to-[#d4af37]"
                  : premiumAccess
                    ? "border border-white/30 bg-gradient-to-br from-[#850010] via-[#c1121f] to-[#ff385c]"
                    : "bg-[#c1121f]"
              }`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className={`mx-auto h-48 w-48 rounded-full object-cover object-top shadow-2xl ${
                    vipAccess
                      ? "border-4 border-yellow-200"
                      : premiumAccess
                        ? "border-4 border-white"
                        : "border-4 border-white/70"
                  }`}
                />
              ) : (
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                  No Image
                </div>
              )}

              <h2 className="font-display mt-8 text-5xl font-bold">
                {profile?.full_name || "My Profile"}
              </h2>

              <p className="mt-3 text-white/75">
                {[profile?.city, profile?.country].filter(Boolean).join(", ") ||
                  "Location not added"}
              </p>

              <div className="mt-6">
                <PlanBadge profile={profile} />
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

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/15 p-6 text-left">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                  Your Plan
                </p>

                <h3 className="mt-4 text-2xl font-black uppercase">{plan}</h3>

                <div className="mt-6 space-y-3 text-white/90">
                  <p>✓ Create Profile</p>
                  <p>✓ Basic Profile Visibility</p>
                  <p>✓ Browse Members</p>
                  <p>✓ Like Profiles</p>
                  <p className={premiumAccess ? "text-green-300" : "text-white/50"}>
                    {premiumAccess ? "✓" : "🔒"} Direct Messaging
                  </p>
                  <p className={premiumAccess ? "text-green-300" : "text-white/50"}>
                    {premiumAccess ? "✓" : "🔒"} See Who Liked You
                  </p>
                  <p className={premiumAccess ? "text-green-300" : "text-white/50"}>
                    {premiumAccess ? "✓" : "🔒"} View Full Profiles
                  </p>
                  <p className={vipAccess ? "text-yellow-300" : "text-white/50"}>
                    {vipAccess ? "✓" : "🔒"} VIP Badge & Priority Placement
                  </p>
                  <p className={vipAccess ? "text-yellow-300" : "text-white/50"}>
                    {vipAccess ? "✓" : "🔒"} Private VIP Support
                  </p>
                </div>

                {!premiumAccess && !married && (
                  <a
                    href="/matchups/checkout"
                    className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-black text-[#b30018]"
                  >
                    Upgrade Now
                  </a>
                )}

                {premiumAccess && !vipAccess && !married && (
                  <a
                    href="/matchups/checkout"
                    className="mt-6 inline-block rounded-full bg-yellow-200 px-6 py-3 font-black text-[#7a0010]"
                  >
                    Upgrade to VIP
                  </a>
                )}
              </div>

              {!married && (
                <a
                  href="/profile/setup"
                  className="mt-8 inline-flex rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
                >
                  Edit Profile
                </a>
              )}
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
                <Info label="Marital Status" value={profile?.marital_status || "Not Added"} />
                <Info label="Country" value={profile?.country || "Not Added"} />
                <Info label="City" value={profile?.city || "Not Added"} />
                <Info label="Occupation" value={profile?.occupation || "Not Added"} />
                <Info label="Faith Background" value={profile?.faith_background || "Not Added"} />
                <Info label="Interests" value={profile?.interests || "Not Added"} />
              </div>

              <ProfileText title="Bio" value={profile?.bio || "No bio added yet."} />

              <ProfileText
                title="Relationship Goal"
                value={profile?.relationship_goal || "No relationship goal added."}
              />

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
            </motion.div>
          </section>

          <section className="mt-14 grid gap-6 md:grid-cols-3">
            <DashboardStat
              title="Likes"
              value={premiumAccess ? likesCount : "Locked"}
              text={
                premiumAccess
                  ? "People interested in your profile."
                  : "Upgrade to Premium or VIP to see who liked you."
              }
              isText={!premiumAccess}
            />

            <DashboardStat
              title="Messages"
              value={premiumAccess ? messagesCount : "Locked"}
              text={
                premiumAccess
                  ? "Unread conversations waiting for you."
                  : "Upgrade to Premium or VIP to unlock messaging."
              }
              isText={!premiumAccess}
            />

            <DashboardStat
              title="Subscription"
              value={plan}
              text="Manage your Matchups membership and access level."
              isText
            />
          </section>

          {academyCount > 0 && (
            <section className="mt-14 rounded-[3rem] border border-yellow-300/40 bg-black/25 p-8 shadow-2xl md:p-12">
              <p className="text-sm font-black uppercase tracking-[0.45em] text-yellow-300">
                Academy Access
              </p>

              <h2 className="font-display mt-4 text-5xl font-bold">
                My Academy 🎓
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
                You have {academyCount} unlocked academy course
                {academyCount > 1 ? "s" : ""}. Continue learning from your
                student area.
              </p>

              <a
                href="/dashboard/my-academy"
                className="mt-8 inline-flex rounded-full bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-8 py-4 font-black text-black transition hover:scale-105"
              >
                Continue Learning
              </a>
            </section>
          )}

          <section className="mt-14 rounded-[3rem] bg-[#c1121f] p-8 shadow-2xl md:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
                  Membership Access
                </p>

                <h2 className="font-display mt-4 text-5xl font-bold">
                  {vipAccess
                    ? "VIP experience unlocked."
                    : premiumAccess
                      ? "Premium features unlocked."
                      : "Upgrade to unlock full access."}
                </h2>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
                  Free members get basic access. Premium members unlock messaging,
                  likes visibility, and fuller profiles. VIP members receive a
                  luxury badge, priority placement, and the highest Matchups visibility.
                </p>
              </div>

              <a
                href="/matchups/checkout"
                className="rounded-full bg-white px-8 py-4 text-center font-black text-[#b30018] transition hover:scale-105"
              >
                Upgrade Plan
              </a>
            </div>
          </section>

          {!married && (
            <section className="mt-14">
              <SectionTitle
                eyebrow="Quick Actions"
                title="Continue Your Matchups Journey"
              />

              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <QuickAction href="/browse" title="Browse Matchups" />
                <QuickAction href="/likes" title="Who Liked Me" locked={!premiumAccess} />
                <QuickAction href="/messages" title="Messages" locked={!premiumAccess} />
                <QuickAction href="/profile/setup" title="Edit Profile" />
              </div>
            </section>
          )}

          <section className="mt-14">
            <SectionTitle eyebrow="Resources" title="Grow Beyond Matchups" />

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <QuickAction href="/about/academy" title="The Academy" />
              <QuickAction href="/counselling" title="Counselling" />
              <QuickAction href="/shop/books" title="Books" />
              <QuickAction href="/articles" title="Articles" />
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
                <AdminLink href="/admin/articles" title="Articles Admin" />
                <AdminLink href="/admin/exceptional-cases" title="Exceptional Cases" />
                <AdminLink href="/admin/counselling-bookings" title="Counselling Admin" />
                <AdminLink href="/admin/shop-orders" title="Shop Orders" />
                <AdminLink href="/admin/contact-messages" title="Contact Messages" />
                <AdminLink href="/admin/gallery" title="Gallery" />
                <AdminLink href="/admin/testimonials" title="Testimonials" />
                <AdminLink href="/admin/users" title="Users" />
                <AdminLink href="/admin/payments" title="Payments" />
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

function ProfileText({ title, value }) {
  return (
    <div className="mt-8">
      <p className="text-sm uppercase tracking-[0.25em] text-red-100">
        {title}
      </p>
      <p className="mt-3 text-lg leading-8 text-white/75">{value}</p>
    </div>
  );
}

function DashboardStat({ title, value, text, isText = false }) {
  return (
    <div className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
        {title}
      </p>

      <h2 className={`mt-5 font-black ${isText ? "text-4xl uppercase" : "text-6xl"}`}>
        {value}
      </h2>

      <p className="mt-5 text-white/75">{text}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
        {eyebrow}
      </p>
      <h2 className="font-display mt-4 text-5xl font-bold">{title}</h2>
    </div>
  );
}

function QuickAction({ href, title, locked = false }) {
  const lockedTitle =
    title === "Who Liked Me"
      ? "Who Liked Me • Upgrade To Find Out"
      : title === "Messages"
        ? "Messages • Upgrade To Unlock"
        : title;

  return (
    <a
      href={locked ? "/matchups/checkout" : href}
      className={`rounded-[2rem] border border-white/15 p-8 text-center font-black transition hover:scale-[1.02] ${
        locked
          ? "bg-black/20 text-white/60"
          : "bg-white/10 hover:bg-white hover:text-[#b30018]"
      }`}
    >
      {locked ? `🔒 ${lockedTitle}` : title}
    </a>
  );
}

function AdminLink({ href, title }) {
  return (
    <a
      href={href}
      className="rounded-full bg-[#b30018] px-8 py-4 font-black text-white transition hover:scale-105"
    >
      {title}
    </a>
  );
}
