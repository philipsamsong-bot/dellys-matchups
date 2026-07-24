// src/app/components/AppAuthBridge.js

"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AppAuthBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openedFromApp = params.get("app") === "1";

    if (!openedFromApp) {
      return undefined;
    }

    function sendSessionToApp(session) {
      if (!session) {
        return;
      }

      if (!window.ReactNativeWebView?.postMessage) {
        return;
      }

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "SUPABASE_AUTH_SUCCESS",
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        })
      );
    }

    async function checkExistingSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Unable to read app auth session:", error.message);
        return;
      }

      sendSessionToApp(session);
    }

    void checkExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sendSessionToApp(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
