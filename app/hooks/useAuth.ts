import { useEffect, useState } from "react";
import { apiUrl } from "~/utils/api";
import { authClient } from "~/lib/auth.client";

interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
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

  useEffect(() => {
    let isMounted = true;
    const extractUser = (data: any): AuthUser | null => {
      if (!data) return null;
      const raw = data.user || data?.data?.user || data?.session?.user || null;
      if (raw) {
        return {
          id: String(raw.id ?? raw.userId ?? ""),
          email: raw.email ?? null,
          name: raw.name ?? null,
          image: raw.image ?? raw.avatarUrl ?? null,
        };
      }
      if (data.session?.userId) {
        return { id: String(data.session.userId) } as AuthUser;
      }
      return null;
    };

    // Fetch helpers return undefined on error (so we don't clear user)
    const fetchRestSession = async (): Promise<AuthUser | null | undefined> => {
      try {
        const sessionUrl = apiUrl("/auth/session");
        const res = await fetch(sessionUrl, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const json = await res.json();
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
      if (next?.id !== user?.id || (!!next !== !!user)) {
        setUser(next ?? null);
      }
    };
    
    const checkSession = async () => {
      try {
        console.log("🔍 Checking session...");
        const sessionUrl = apiUrl("/auth/session");
        console.log("🔍 Fetching session from:", sessionUrl);
        
        const res = await fetch(sessionUrl, { 
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Accept: "application/json"
          }
        });
        
        console.log("🌐 API response status:", res.status);
        
        if (res.ok) {
          const session = await res.json();
          console.log("🌐 API session:", session);
          if (isMounted) {
            setUser(extractUser(session));
          }
        } else if (res.status === 404) {
          // No active session is a normal state; don't treat as an error
          if (isMounted) {
            setUser(null);
          }
        } else {
          const errorText = await res.text().catch(() => "<no body>");
          console.warn("🌐 API error body:", errorText);
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.log("❌ API call error:", err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
    const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
    
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
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        console.log("🧹 Cleaning up URL:", url.toString());
        window.history.replaceState({}, '', url.toString());
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
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Poll less frequently to avoid noisy logs
    const interval = setInterval(() => {
      if (!isMounted) return;
      Promise.all([fetchRestSession(), fetchClientSession()]).then(([a, b]) => reconcileAndSet(a, b));
    }, 15000);
    
    // Subscribe to Better Auth state changes
    const unsubscribe = authClient.onAuthStateChange?.((event: any) => {
      if (!isMounted) return;
      const nextUser = extractUser(event);
      if (typeof nextUser !== 'undefined') setUser(nextUser);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      console.log("🔐 Starting Google sign-in...");
      const response = await fetch(apiUrl("/auth/sign-in/social"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Let Better Auth handle callback at /api/auth/callback/google and then redirect back
        body: JSON.stringify({ provider: "google" })
      });
      if (response.ok) {
        const result = await response.json();
        console.log("🔐 Sign-in response:", result);
        if (result.url) {
          console.log("🔐 Redirecting to:", result.url);
          window.location.href = result.url;
        }
      } else {
        console.error("❌ Sign-in failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("❌ Sign in error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Signing out...");
      const response = await fetch(apiUrl("/auth/sign-out"), {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("✅ Sign-out successful");
        setUser(null);
      } else {
        console.log("❌ Sign out failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  return { user, isLoading, isSigningIn, signInWithGoogle, signOut };
}