// src/app/admin/users/page.js

"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

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

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    void loadUsers();
  }, []);

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      window.location.href = "/auth/login";
      throw new Error("Not authenticated.");
    }

    return session.access_token;
  }

  async function adminFetch(url, options = {}) {
    const accessToken = await getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      window.location.href = "/auth/login";

      throw new Error(
        data.error || "Your session has expired.",
      );
    }

    if (response.status === 403) {
      window.location.href = "/dashboard";

      throw new Error(
        data.error || "Admin access required.",
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to complete the admin request.",
      );
    }

    return data;
  }

  async function loadUsers() {
    setLoading(true);
    setPageError("");

    try {
      const data = await adminFetch(
        "/api/admin/users",
        {
          method: "GET",
        },
      );

      setUsers(
        Array.isArray(data.users)
          ? data.users
          : [],
      );
    } catch (error) {
      setPageError(
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      const effectiveMembership =
        getEffectiveMembership(user);

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

  function replaceUser(updatedUser) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === updatedUser.id
          ? updatedUser
          : user,
      ),
    );
  }

  async function updateUser(userId, payload) {
    if (savingId) {
      return null;
    }

    setSavingId(userId);

    try {
      const data = await adminFetch(
        "/api/admin/users",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: userId,
            ...payload,
          }),
        },
      );

      if (!data.user) {
        throw new Error(
          "The updated user was not returned.",
        );
      }

      replaceUser(data.user);

      return data.user;
    } catch (error) {
      alert(
        getErrorMessage(error),
      );

      return null;
    } finally {
      setSavingId("");
    }
  }

  async function handleMembershipChange(
    user,
    nextMembership,
  ) {
    if (
      nextMembership ===
      getEffectiveMembership(user)
    ) {
      return;
    }

    const confirmed = window.confirm(
      nextMembership === "free"
        ? `Downgrade ${
            user.full_name ||
            user.email ||
            "this user"
          } to Free?`
        : `Change ${
            user.full_name ||
            user.email ||
            "this user"
          } to ${nextMembership.toUpperCase()}?`,
    );

    if (!confirmed) {
      return;
    }

    const previousMembership =
      getEffectiveMembership(user);

    const updatedUser =
      await updateUser(
        user.id,
        {
          membership:
            nextMembership,
        },
      );

    if (!updatedUser) {
      return;
    }

    if (nextMembership === "free") {
      alert(
        `${
          updatedUser.full_name ||
          updatedUser.email ||
          "User"
        } has been downgraded to free.`,
      );

      return;
    }

    const actionLabel =
      isPaidMembership(
        previousMembership,
      )
        ? "extended/updated"
        : "upgraded";

    alert(
      `${
        updatedUser.full_name ||
        updatedUser.email ||
        "User"
      } has been ${actionLabel} to ${nextMembership}.`,
    );
  }

  async function handleRoleChange(
    user,
    nextRole,
  ) {
    if (nextRole === user.role) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${
        user.full_name ||
        user.email ||
        "this user"
      } role to ${nextRole}?`,
    );

    if (!confirmed) {
      return;
    }

    const updatedUser =
      await updateUser(
        user.id,
        {
          role: nextRole,
        },
      );

    if (!updatedUser) {
      return;
    }

    alert(
      `${
        updatedUser.full_name ||
        updatedUser.email ||
        "User"
      } role updated to ${nextRole}.`,
    );
  }

  async function handleVisibilityChange(
    user,
    isVisible,
  ) {
    await updateUser(
      user.id,
      {
        is_visible:
          isVisible,
      },
    );
  }

  async function handleEligibilityChange(
    user,
    isEligible,
  ) {
    await updateUser(
      user.id,
      {
        matchups_eligible:
          isEligible,
      },
    );
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />

        <main className="flex min-h-screen items-center justify-center bg-[#b30018] px-6 text-white">
          <p className="text-xl font-bold">
            Loading users...
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-16 text-white">
        <section className="mx-auto max-w-7xl">
          <a
            href="/dashboard"
            className="font-bold text-white/70 hover:text-white"
          >
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
              View users, update membership plans,
              visibility, eligibility, and admin roles.
            </p>

            {pageError && (
              <div className="mt-8 rounded-[2rem] bg-[#fff8f5] p-6">
                <p className="font-black text-[#b30018]">
                  Unable to load users
                </p>

                <p className="mt-3 text-black/70">
                  {pageError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadUsers()
                  }
                  className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
                >
                  Try Again
                </button>
              </div>
            )}

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email, country, city, role or plan..."
              className="mt-8 h-14 w-full rounded-2xl border border-black/10 px-5 outline-none"
            />

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                  <tr className="border-b border-black/10 text-left text-sm uppercase tracking-[0.2em] text-black/50">
                    <th className="py-4 pr-4">
                      User
                    </th>

                    <th className="py-4 pr-4">
                      Location
                    </th>

                    <th className="py-4 pr-4">
                      Plan
                    </th>

                    <th className="py-4 pr-4">
                      Expires
                    </th>

                    <th className="py-4 pr-4">
                      Role
                    </th>

                    <th className="py-4 pr-4">
                      Visible
                    </th>

                    <th className="py-4 pr-4">
                      Eligible
                    </th>

                    <th className="py-4 pr-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const membership =
                      getEffectiveMembership(user);

                    const busy =
                      savingId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-black/10"
                      >
                        <td className="py-5 pr-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                user.avatar_url ||
                                "/placeholder-profile.webp"
                              }
                              alt={
                                user.full_name ||
                                "User"
                              }
                              className="h-14 w-14 rounded-full object-cover object-top"
                            />

                            <div>
                              <p className="font-black">
                                {user.full_name ||
                                  "Unnamed User"}
                              </p>

                              <p className="text-sm text-black/50">
                                {user.email ||
                                  "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-5 pr-4 text-sm">
                          {[user.city, user.country]
                            .filter(Boolean)
                            .join(", ") ||
                            "Not added"}
                        </td>

                        <td className="py-5 pr-4">
                          <select
                            value={membership}
                            disabled={
                              savingId !== ""
                            }
                            onChange={(event) =>
                              void handleMembershipChange(
                                user,
                                event.target.value,
                              )
                            }
                            className="rounded-xl border border-black/10 px-4 py-3 disabled:opacity-50"
                          >
                            <option value="free">
                              Free
                            </option>

                            <option value="premium">
                              Premium
                            </option>

                            <option value="vip">
                              VIP
                            </option>
                          </select>
                        </td>

                        <td className="py-5 pr-4 text-sm">
                          {user.membership_expires_at
                            ? new Date(
                                user.membership_expires_at,
                              ).toLocaleString()
                            : "—"}
                        </td>

                        <td className="py-5 pr-4">
                          <select
                            value={
                              user.role ||
                              "user"
                            }
                            disabled={
                              savingId !== ""
                            }
                            onChange={(event) =>
                              void handleRoleChange(
                                user,
                                event.target.value,
                              )
                            }
                            className="rounded-xl border border-black/10 px-4 py-3 disabled:opacity-50"
                          >
                            <option value="user">
                              User
                            </option>

                            <option value="admin">
                              Admin
                            </option>
                          </select>
                        </td>

                        <td className="py-5 pr-4">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              user.is_visible,
                            )}
                            disabled={
                              savingId !== ""
                            }
                            onChange={(event) =>
                              void handleVisibilityChange(
                                user,
                                event.target.checked,
                              )
                            }
                            className="h-6 w-6 disabled:opacity-50"
                          />
                        </td>

                        <td className="py-5 pr-4">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              user.matchups_eligible,
                            )}
                            disabled={
                              savingId !== ""
                            }
                            onChange={(event) =>
                              void handleEligibilityChange(
                                user,
                                event.target.checked,
                              )
                            }
                            className="h-6 w-6 disabled:opacity-50"
                          />
                        </td>

                        <td className="py-5 pr-4">
                          <a
                            href={`/profile/${encodeURIComponent(
                              user.id,
                            )}`}
                            className="rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
                          >
                            View
                          </a>

                          {busy && (
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
