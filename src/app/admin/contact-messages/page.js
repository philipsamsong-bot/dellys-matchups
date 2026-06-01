"use client";

import { useEffect, useState } from "react";
import{useRouter} from "next/navigation";
import { SiteNav, SiteFooter } from "@/app/components/SiteChrome";
import { supabase } from "@/lib/supabase";

export default function AdminContactMessagesPage() {
    const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }

  async function deleteMessage(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchMessages();
  }

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        router.push("/login");
        return;
      }
  
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
  
      if (!profile || profile.role !== "admin") {
        router.push("/");
        return;
      }
  
      fetchMessages();
    }
  
    checkAdmin();
  }, []);
  
  return (
    <>
      <SiteNav />

      <main className="min-h-screen bg-[#b30018] px-6 pb-32 pt-44 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[3rem] bg-[#c1121f] p-10 shadow-2xl md:p-16">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-red-100">
              Admin Dashboard
            </p>

            <h1 className="mt-6 font-serif text-6xl font-black leading-none md:text-7xl">
              Contact Messages
            </h1>

            <p className="mt-8 max-w-4xl text-xl leading-10 text-white/80">
              View and manage all incoming messages submitted through the
              DMs Contact page.
            </p>
          </div>

          {loading ? (
            <div className="mt-12 rounded-[2rem] bg-[#c1121f] p-10 text-center text-2xl font-bold shadow-2xl">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="mt-12 rounded-[2rem] bg-[#c1121f] p-10 text-center text-2xl font-bold shadow-2xl">
              No messages found.
            </div>
          ) : (
            <div className="mt-12 grid gap-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-[2.5rem] bg-[#c1121f] p-8 shadow-2xl md:p-10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
                        Contact Message
                      </p>

                      <h2 className="mt-4 text-4xl font-black">
                        {message.full_name}
                      </h2>

                      <div className="mt-6 space-y-3 text-lg text-white/80">
                        <p>
                          <span className="font-bold text-white">
                            Email:
                          </span>{" "}
                          {message.email}
                        </p>

                        {message.phone && (
                          <p>
                            <span className="font-bold text-white">
                              Phone:
                            </span>{" "}
                            {message.phone}
                          </p>
                        )}

                        <p>
                          <span className="font-bold text-white">
                            Subject:
                          </span>{" "}
                          {message.subject}
                        </p>

                        <p>
                          <span className="font-bold text-white">
                            Date:
                          </span>{" "}
                          {new Date(
                            message.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#b30018] transition hover:scale-105"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-10 rounded-[2rem] bg-white/10 p-8">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-red-100">
                      Message
                    </p>

                    <p className="mt-6 whitespace-pre-wrap text-xl leading-10 text-white/85">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
