// src/app/admin/contact-messages/page.js

"use client";

import { useEffect, useState } from "react";
import DashboardChrome from "@/app/components/DashboardChrome";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    void fetchMessages();
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

      throw new Error(
        "Not authenticated.",
      );
    }

    return session.access_token;
  }

  async function adminFetch(
    url,
    options = {},
  ) {
    const token =
      await getAccessToken();

    const response =
      await fetch(url, {
        ...options,

        headers: {
          ...(options.headers || {}),

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      });

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (
      response.status === 401
    ) {
      window.location.href =
        "/auth/login";

      throw new Error(
        data.error ||
          "Your session has expired.",
      );
    }

    if (
      response.status === 403
    ) {
      window.location.href =
        "/dashboard";

      throw new Error(
        data.error ||
          "Admin access required.",
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to complete the admin request.",
      );
    }

    return data;
  }

  async function fetchMessages() {
    setLoading(true);
    setPageError("");

    try {
      const data =
        await adminFetch(
          "/api/admin/contact-messages",
          {
            method: "GET",
          },
        );

      setMessages(
        Array.isArray(
          data.messages,
        )
          ? data.messages
          : [],
      );

      setAdminReady(true);
    } catch (error) {
      setAdminReady(false);

      setPageError(
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(
    message,
  ) {
    if (deletingId !== null) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete the message from ${
          message.full_name ||
          message.email ||
          "this sender"
        } permanently?`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(message.id);

    try {
      await adminFetch(
        `/api/admin/contact-messages?id=${encodeURIComponent(
          message.id,
        )}`,
        {
          method: "DELETE",
        },
      );

      setMessages(
        (
          currentMessages,
        ) =>
          currentMessages.filter(
            (item) =>
              item.id !==
              message.id,
          ),
      );

      alert(
        "Contact message deleted.",
      );
    } catch (error) {
      alert(
        getErrorMessage(error),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <DashboardChrome />

      <main className="min-h-screen bg-[#b30018] px-6 pb-32 pt-16 text-white">
        <div className="mx-auto max-w-7xl">
          <a
            href="/dashboard"
            className="font-bold text-white/70 hover:text-white"
          >
            ← Back to Dashboard
          </a>

          <div className="mt-8 rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Admin Dashboard
            </p>

            <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
              Contact Messages
            </h1>

            <p className="mt-8 max-w-4xl text-xl leading-10 text-white/80">
              View and manage all
              incoming messages
              submitted through
              the DMs Contact
              page.
            </p>
          </div>

          {pageError && (
            <div className="mt-12 rounded-[2rem] bg-white p-8 text-[#b30018] shadow-2xl">
              <p className="font-black">
                Unable to load
                contact messages
              </p>

              <p className="mt-3">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void fetchMessages()
                }
                className="mt-5 rounded-full bg-[#b30018] px-5 py-3 font-black text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-12 rounded-[2rem] bg-[#c1121f] p-10 text-center text-2xl font-bold shadow-2xl">
              Loading messages...
            </div>
          ) : messages.length ===
            0 ? (
            <div className="mt-12 rounded-[2rem] bg-[#c1121f] p-10 text-center text-2xl font-bold shadow-2xl">
              No messages found.
            </div>
          ) : (
            <div className="mt-12 grid gap-8">
              {messages.map(
                (message) => {
                  const busy =
                    deletingId ===
                    message.id;

                  return (
                    <div
                      key={
                        message.id
                      }
                      className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                            Contact
                            Message
                          </p>

                          <h2 className="mt-4 text-4xl font-black">
                            {message.full_name ||
                              "Unknown Sender"}
                          </h2>

                          <div className="mt-6 space-y-3 text-lg text-white/80">
                            <p>
                              <span className="font-bold text-white">
                                Email:
                              </span>{" "}
                              {message.email ||
                                "N/A"}
                            </p>

                            {message.phone && (
                              <p>
                                <span className="font-bold text-white">
                                  Phone:
                                </span>{" "}
                                {
                                  message.phone
                                }
                              </p>
                            )}

                            <p>
                              <span className="font-bold text-white">
                                Subject:
                              </span>{" "}
                              {message.subject ||
                                "No subject"}
                            </p>

                            <p>
                              <span className="font-bold text-white">
                                Date:
                              </span>{" "}
                              {message.created_at
                                ? new Date(
                                    message.created_at,
                                  ).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            !adminReady ||
                            deletingId !==
                              null
                          }
                          onClick={() =>
                            void deleteMessage(
                              message,
                            )
                          }
                          className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#b30018] transition hover:scale-105 disabled:opacity-50"
                        >
                          {busy
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>

                      <div className="mt-10 rounded-[2rem] bg-white/10 p-8">
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                          Message
                        </p>

                        <p className="mt-6 whitespace-pre-wrap break-words text-xl leading-10 text-white/85">
                          {message.message ||
                            ""}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
