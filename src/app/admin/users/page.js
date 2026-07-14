"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function isAdmin(profile) {
  return profile?.role === "admin";
}

function isPaidMembership(value) {
  return value === "premium" || value === "vip";
}

function getEffectiveMembership(user) {
  if (isPaidMembership(user.membership_status)) {
    return user.membership_status;
  }

  if (isPaidMembership(user.membership_plan)) {
    return user.membership_plan;
  }

  if (isPaidMembership(user.plan)) {
    return user.plan;
  }

  if (isPaidMembership(user.subscription)) {
    return user.subscription;
  }

  return "free";
}

function addOneMonth(dateValue) {
  const baseDate = new Date(dateValue);
  const result = new Date(baseDate);
  result.setMonth(result.getMonth() + 1);
  return result.toISOString();
}

function getMembershipAnchorDate(user) {
  const now = new Date();
  const currentExpiry = user.membership_expires_at
    ? new Date(user.membership_expires_at)
    : null;

  if (currentExpiry && currentExpiry > now) {
    return currentExpiry.toISOString();
  }

  return now.toISOString();
}

function buildMembershipUpdate(nextMembership, currentUser) {
  if (nextMembership === "free") {
    return {
      membership_status: "free",
      membership_plan: "free",
      membership_started_at: null,
      membership_expires_at: null,
      plan: "free",
      subscription: "free",
    };
  }

  const anchorDate = getMembershipAnchorDate(currentUser);
  const currentEffectiveMembership = getEffectiveMembership(currentUser);
  const isAlreadyPaid = isPaidMembership(currentEffectiveMembership);

  return {
    membership_status: nextMembership,
    membership_plan: nextMembership,
    membership_started_at: isAlreadyPaid
      ? currentUser.membership_started_at || new Date().toISOString()
      : new Date().toISOString(),
    membership_expires_at: addOneMonth(anchorDate),
    plan: nextMembership,
    subscription: nextMembership,
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    async function loadUsers() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        alert(profileError.message);
        setLoading(false);
        return;
      }

      if (!isAdmin(profile)) {
        window.location.href = "/dashboard";
        return;
      }

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setUsers(profiles || []);
      setLoading(false);
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      const effectiveMembership = getEffectiveMembership(user);

      return [
        user.full_name,
        user.email,
        user.country,
        user.city,
        user.role,
        user.membership_status,
        user.membership_plan,
        user.plan,
        user.subscription,
        effectiveMembership,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [users, search]);

  async function updateUser(userId, updates) {
    setSavingId(userId);

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    setSavingId("");

    if (error) {
      alert(error.message);
      return false;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      )
    );

    return true;
  }

  async function handleMembershipChange(user, nextMembership) {
    const updates = buildMembershipUpdate(nextMembership, user);
    const success = await updateUser(user.id, updates);

    if (!success) return;

    if (nextMembership === "free") {
      alert(`${user.full_name || user.email || "User"} has been downgraded to free.`);
      return;
    }

    const previousMembership = getEffectiveMembership(user);
    const actionLabel = isPaidMembership(previousMembership)
      ? "extended/updated"
      : "upgraded";

    alert(
      `${user.full_name || user.email || "User"} has been ${actionLabel} to ${nextMembership}.`
    );
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading users...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-16 text-white">
        <section className="mx-auto max-w-7xl">
          <a href="/dashboard" className="font-bold text-white/70 hover:text-white">
            ← Back to Dashboard
          </a>

          <div className="mt-8 rounded-[3rem] bg-white p-8 text-black shadow-2xl md:p-12">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-[#b30018]">
              Admin
            </p>

            <h1 className="font-display mt-4 text-5xl font-bold">
              Manage Users
            </h1>

            <p className="mt-4 text-black/60">
              View users, update membership plans, visibility, eligibility, and admin roles.
            </p>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, country, city, role or plan..."
              className="mt-8 h-14 w-full rounded-2xl border border-black/10 px-5 outline-none"
            />

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                  <tr className="border-b border-black/10 text-left text-sm uppercase tracking-[0.2em] text-black/50">
                    <th className="py-4 pr-4">User</th>
                    <th className="py-4 pr-4">Location</th>
                    <th className="py-4 pr-4">Plan</th>
                    <th className="py-4 pr-4">Expires</th>
                    <th className="py-4 pr-4">Role</th>
                    <th className="py-4 pr-4">Visible</th>
                    <th className="py-4 pr-4">Eligible</th>
                    <th className="py-4 pr-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const membership = getEffectiveMembership(user);

                    return (
                      <tr key={user.id} className="border-b border-black/10">
                        <td className="py-5 pr-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={user.avatar_url || "/placeholder-profile.webp"}
                              alt={user.full_name || "User"}
                              className="h-14 w-14 rounded-full object-cover object-top"
                            />

                            <div>
                              <p className="font-black">
                                {user.full_name || "Unnamed User"}
                              </p>

                              <p className="text-sm text-black/50">
                                {user.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-5 pr-4 text-sm">
                          {[user.city, user.country].filter(Boolean).join(", ") || "Not added"}
                        </td>

                        <td className="py-5 pr-4">
                          <select
                            value={membership}
                            onChange={(event) =>
                              handleMembershipChange(user, event.target.value)
                            }
                            className="rounded-xl border border-black/10 px-4 py-3"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="vip">VIP</option>
                          </select>
                        </td>

                        <td className="py-5 pr-4 text-sm">
                          {user.membership_expires_at
                            ? new Date(user.membership_expires_at).toLocaleString()
                            : "—"}
                        </td>

                        <td className="py-5 pr-4">
                          <select
                            value={user.role || "user"}
                            onChange={(event) =>
                              updateUser(user.id, { role: event.target.value })
                            }
                            className="rounded-xl border border-black/10 px-4 py-3"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        <td className="py-5 pr-4">
                          <input
                            type="checkbox"
                            checked={Boolean(user.is_visible)}
                            onChange={(event) =>
                              updateUser(user.id, {
                                is_visible: event.target.checked,
                              })
                            }
                            className="h-6 w-6"
                          />
                        </td>

                        <td className="py-5 pr-4">
                          <input
                            type="checkbox"
                            checked={Boolean(user.matchups_eligible)}
                            onChange={(event) =>
                              updateUser(user.id, {
                                matchups_eligible: event.target.checked,
                              })
                            }
                            className="h-6 w-6"
                          />
                        </td>

                        <td className="py-5 pr-4">
                          <a
                            href={`/profile/${user.id}`}
                            className="rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
                          >
                            View
                          </a>

                          {savingId === user.id && (
                            <p className="mt-2 text-sm text-black/50">
                              Saving...
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-black/50">
                  No users found.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
