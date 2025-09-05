import { useEffect, useState } from "react";
import { apiUrl } from "~/utils/api";
import { authClient } from "~/lib/auth.client";
import { useNavigate } from "react-router";
import { normalizeAuthUser } from "~/schemas/auth";

interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface AuthResponse {
  user?: {
    id?: string;
    userId?: string;
    email?: string;
    name?: string;
    image?: string;
    avatarUrl?: string;
  };
  data?: {
    user?: {
      id?: string;
      userId?: string;
      email?: string;
      name?: string;
      image?: string;
      avatarUrl?: string;
    };
  };
  session?: {
    user?: {
      id?: string;
      userId?: string;
      email?: string;
      name?: string;
      image?: string;
      avatarUrl?: string;
    };
    userId?: string;
  };
}

interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const extractUser = (data: unknown): AuthUser | null => {
      const u = normalizeAuthUser(data);
      return u ? { id: u.id, email: u.email ?? null, name: u.name ?? null, image: u.image ?? null } : null;
    };

    // Fetch helpers return undefined on error (so we don't clear user)
    const fetchRestSession = async (): Promise<AuthUser | null | undefined> => {
      try {
        const sessionUrl = apiUrl("/api/auth/session", false, true);
        const res = await fetch(sessionUrl, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Accept: "application/json",
          },
        });
        console.log("fetchRestSession");
        console.log("🔍 Fetching session from:", sessionUrl);
        console.log("🔍 API response status:", res.status);
        console.log("🔍 API response:", res);
        if (res.ok) {
          const json = await res.json();
          console.log("🔍 API response JSON:", json);
          return extractUser(json);
        }
        if (res.status === 404) return null;
        return undefined;
      } catch {
        return undefined;
      }
    };

    const fetchClientSession = async (): Promise<AuthUser | null | undefined> => {
      try {
        const result = await authClient.getSession?.();
        return extractUser(result);
      } catch {
        return undefined;
      }
    };

    const reconcileAndSet = (a: AuthUser | null | undefined, b: AuthUser | null | undefined) => {
      if (!isMounted) return;
      // Prefer any non-null user; only set null if both sources are null
      const next = a || b || (a === null && b === null ? null : user);
      if (next?.id !== user?.id || !!next !== !!user) {
        setUser(next ?? null);
      }
    };

    // Combined initial check
    const initialCheck = async () => {
      const [a, b] = await Promise.all([fetchRestSession(), fetchClientSession()]);
      reconcileAndSet(a, b);
      if (isMounted) setIsLoading(false);
    };

    // Check if we're returning from OAuth (look for common OAuth params)
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has("code") || urlParams.has("state") || urlParams.has("error");

    console.log("🔍 Current URL:", window.location.href);
    console.log("🔍 URL params:", Object.fromEntries(urlParams.entries()));
    console.log("🔍 Has OAuth params:", hasOAuthParams);

    if (hasOAuthParams) {
      console.log("🔄 OAuth callback detected, processing...");
      let attempts = 0;
      const checkWithRetry = async () => {
        attempts++;
        const [a, b] = await Promise.all([fetchRestSession(), fetchClientSession()]);
        reconcileAndSet(a, b);
        if (attempts < 5) {
          setTimeout(checkWithRetry, 800);
        }
      };
      setTimeout(checkWithRetry, 400);
      // Clean up URL by removing OAuth params after processing
      setTimeout(() => {
        const url = new URL(window.location.href);
        // Validate that we're only modifying search params and not changing origin
        if (url.origin === window.location.origin) {
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          url.searchParams.delete("error");
          console.log("🧹 Cleaning up URL:", url.toString());
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
      }, 5000);
      initialCheck();
    } else {
      console.log("🔍 No OAuth params, doing regular session check");
      initialCheck();
    }

    // Listen for auth state changes (when returning from OAuth)
    const handleFocus = () => {
      if (!isMounted) return;
      console.log("🔍 Window focused, checking session...");
      Promise.all([fetchRestSession(), fetchClientSession()]).then(([a, b]) => reconcileAndSet(a, b));
    };

    const handleVisibilityChange = () => {
      if (!isMounted || document.hidden) return;
      console.log("🔍 Page became visible, checking session...");
      setTimeout(() => {
        Promise.all([fetchRestSession(), fetchClientSession()]).then(([a, b]) => reconcileAndSet(a, b));
      }, 150);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Removed periodic polling per request; rely on SSR + focus/visibility

    // Subscribe to Better Auth state changes (if available)
    let unsubscribe: (() => void) | undefined;
    if ("onAuthStateChange" in authClient && typeof authClient.onAuthStateChange === "function") {
      unsubscribe = authClient.onAuthStateChange((event: unknown) => {
        if (!isMounted) return;
        const nextUser = extractUser(event);
        if (typeof nextUser !== "undefined") setUser(nextUser);
      });
    }

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // no interval to clear
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [user]);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      console.log("🔐 Starting Google sign-in...");
      // Try using Better Auth client's signIn method first
      if (authClient.signIn) {
        console.log("🔐 Using Better Auth client signIn");
        try {
          const result = await authClient.signIn.social({
            provider: "google",
            callbackURL: "/projects",
          });
          console.log("🔐 Sign-in response:", result);
          return;
        } catch (clientError) {
          console.log("🔐 Client signIn failed", clientError);
        }
      }

      // Fallback to REST API call with correct endpoint
      // console.log("🔐 Using REST API signIn");
      // const signInUrl = apiUrl("/api/auth/sign-in/social", false, true);
      // console.log("🔐 Sign-in URL:", signInUrl);
      // const response = await fetch(signInUrl, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   // Let Better Auth handle callback at /api/auth/callback/google and then redirect back
      //   body: JSON.stringify({ provider: "google" })
      // });
      // if (response.ok) {
      //   const result = await response.json();
      //   console.log("🔐 Sign-in response:", result);
      //   if (result.url) {
      //     console.log("🔐 Redirecting to:", result.url);
      //     window.location.href = result.url;
      //   }
      // } else {
      //   console.error("❌ Sign-in failed:", response.status, await response.text());
      // }
    } catch (error) {
      console.error("❌ Sign in error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Signing out...");

      // Try using Better Auth client's signOut method first
      if (authClient.signOut) {
        console.log("🔐 Using Better Auth client signOut");
        const result = await authClient.signOut();
        console.log("✅ Sign-out successful via client");
        setUser(null);
      } else {
        console.log("❌ Sign out failed");
      }

      // Fallback to REST API call with correct endpoint
      // console.log("🔐 Using REST API signOut");
      // const signOutUrl = apiUrl("/api/auth/sign-out", false, true);
      // console.log("URL:", signOutUrl);
      // const response = await fetch(signOutUrl, {
      //   method: "POST",
      //   credentials: "include",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

      // if (response.ok) {
      //   console.log("✅ Sign-out successful");
      //   setUser(null);
      // } else {
      //   console.log("❌ Sign out failed:", response.status, await response.text());
      // }
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  return { user, isLoading, isSigningIn, signInWithGoogle, signOut };
}
