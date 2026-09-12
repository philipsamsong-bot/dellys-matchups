// src/app/calls/[callId]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardChrome from "@/app/components/DashboardChrome";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function CallPage() {
  const { callId } = useParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [call, setCall] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null);

  const isCaller = useMemo(() => {
    if (!call || !currentUser) return false;
    return call.caller_id === currentUser.id;
  }, [call, currentUser]);

  const isReceiver = useMemo(() => {
    if (!call || !currentUser) return false;
    return call.receiver_id === currentUser.id;
  }, [call, currentUser]);

  const otherUserId = useMemo(() => {
    if (!call || !currentUser) return null;
    return isCaller ? call.receiver_id : call.caller_id;
  }, [call, currentUser, isCaller]);

  useEffect(() => {
    async function loadCall() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/auth/login";
        return;
      }

      setCurrentUser(session.user);

      const { data: callRow, error: callError } = await supabase
        .from("matchup_calls")
        .select("*")
        .eq("id", callId)
        .single();

      if (callError || !callRow) {
        alert(callError?.message || "Call not found.");
        router.push("/browse");
        return;
      }

      const isParticipant =
        callRow.caller_id === session.user.id ||
        callRow.receiver_id === session.user.id;

      if (!isParticipant) {
        alert("You are not allowed to view this call.");
        router.push("/browse");
        return;
      }

      setCall(callRow);

      const participantId =
        callRow.caller_id === session.user.id
          ? callRow.receiver_id
          : callRow.caller_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", participantId)
        .single();

      setOtherProfile(profile || null);
      setLoading(false);
    }

    loadCall();
  }, [callId, router]);

  async function callApi(endpoint) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("Please sign in again.");
      return null;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ callId }),
    });

    const payload = await response.json();

    if (!response.ok) {
      alert(payload.error || "Request failed.");
      return null;
    }

    return payload.call;
  }

  async function handleAcceptCall() {
    setProcessingAction("accept");
    const updatedCall = await callApi("/api/calls/accept");
    setProcessingAction(null);

    if (!updatedCall) return;

    setCall(updatedCall);
    alert("Call accepted.");
  }

  async function handleRejectCall() {
    setProcessingAction("reject");
    const updatedCall = await callApi("/api/calls/reject");
    setProcessingAction(null);

    if (!updatedCall) return;

    setCall(updatedCall);
    alert("Call rejected.");
    router.push(otherUserId ? `/chat/${otherUserId}` : "/browse");
  }

  async function handleMissedCall() {
    setProcessingAction("miss");
    const updatedCall = await callApi("/api/calls/miss");
    setProcessingAction(null);

    if (!updatedCall) return;

    setCall(updatedCall);
    alert("Call marked as missed.");
    router.push(otherUserId ? `/chat/${otherUserId}` : "/browse");
  }

  async function handleEndCall() {
    setProcessingAction("end");
    const updatedCall = await callApi("/api/calls/end");
    setProcessingAction(null);

    if (!updatedCall) return;

    setCall(updatedCall);
    alert("Call ended.");
    router.push(otherUserId ? `/chat/${otherUserId}` : "/browse");
  }

  if (loading) {
    return (
      <>
        <DashboardChrome />
        <main className="flex min-h-screen items-center justify-center bg-[#b30018] text-white">
          <p className="text-xl font-bold">Loading call...</p>
        </main>
      </>
    );
  }

  const isInitiated = call?.status === "initiated";
  const isAccepted = call?.status === "accepted";
  const isFinished =
    call?.status === "ended" ||
    call?.status === "rejected" ||
    call?.status === "missed";

  return (
    <>
      <DashboardChrome />
      <main className="min-h-screen bg-[#b30018] px-6 pb-24 pt-32 text-white">
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-white/10 bg-[#7a0010]/60 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-red-100">
            Matchups Call
          </p>

          <h1 className="mt-5 font-serif text-5xl font-black">
            {call?.call_type === "video" ? "Video Call" : "Audio Call"}
          </h1>

          <p className="mt-4 text-white/70">
            This page tracks the call lifecycle. The live in-call media screen
            will be connected next.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] bg-white/10 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-red-100">
                Participant
              </p>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={otherProfile?.avatar_url || "/placeholder-profile.webp"}
                  alt={otherProfile?.full_name || "Member"}
                  className="h-16 w-16 rounded-full object-cover object-top"
                />
                <div>
                  <p className="text-2xl font-black">
                    {otherProfile?.full_name || "Member"}
                  </p>
                  <p className="text-white/65">
                    {otherProfile?.city || "Delly's Matchups member"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/10 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-red-100">
                Call Details
              </p>
              <div className="mt-4 space-y-2 text-white/80">
                <p>Status: {call?.status || "—"}</p>
                <p>Created: {formatDateTime(call?.created_at)}</p>
                <p>Started: {formatDateTime(call?.started_at)}</p>
                <p>Ended: {formatDateTime(call?.ended_at)}</p>
                <p>Stream ID: {call?.stream_call_id || "—"}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {isReceiver && isInitiated && (
              <>
                <button
                  type="button"
                  onClick={handleAcceptCall}
                  disabled={processingAction !== null}
                  className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
                >
                  {processingAction === "accept" ? "Accepting..." : "Accept Call"}
                </button>

                <button
                  type="button"
                  onClick={handleRejectCall}
                  disabled={processingAction !== null}
                  className="rounded-full border border-white/20 px-8 py-4 font-black text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  {processingAction === "reject" ? "Rejecting..." : "Reject Call"}
                </button>
              </>
            )}

            {isCaller && isInitiated && (
              <button
                type="button"
                onClick={handleMissedCall}
                disabled={processingAction !== null}
                className="rounded-full border border-white/20 px-8 py-4 font-black text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                {processingAction === "miss" ? "Marking..." : "Mark As Missed"}
              </button>
            )}

            {isAccepted && (
              <button
                type="button"
                onClick={handleEndCall}
                disabled={processingAction !== null}
                className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105 disabled:opacity-60"
              >
                {processingAction === "end" ? "Ending..." : "End Call"}
              </button>
            )}

            {isFinished && (
              <button
                type="button"
                onClick={() => router.push(otherUserId ? `/chat/${otherUserId}` : "/browse")}
                className="rounded-full bg-white px-8 py-4 font-black text-[#b30018] transition hover:scale-105"
              >
                Back To Chat
              </button>
            )}

            {!isFinished && (
              <button
                type="button"
                onClick={() => router.push(otherUserId ? `/chat/${otherUserId}` : "/browse")}
                className="rounded-full border border-white/20 px-8 py-4 font-black text-white transition hover:bg-white/10"
              >
                Back To Chat
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
