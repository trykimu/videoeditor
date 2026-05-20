import { useEffect, useState } from "react";
import { authClient } from "~/lib/auth-client";
import { normalizeAuthUser } from "~/schemas/auth";

type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await authClient.getSession?.();
        const normalized = normalizeAuthUser(result);
        if (isMounted) {
          setUser(
            normalized
              ? {
                  id: normalized.id,
                  name: normalized.name ?? null,
                  email: normalized.email ?? null,
                  image: normalized.image ?? null,
                }
              : null,
          );
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/projects" });
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
    } catch {
      // Ignore sign-out errors in UI flow.
    }
  };

  return { user, isLoading, isSigningIn, signInWithGoogle, signOut };
}
