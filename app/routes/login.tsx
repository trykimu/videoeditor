import type { Route } from "./+types/login";
import React, { useEffect } from "react";
import { AuthOverlay } from "~/components/ui/AuthOverlay";
import { auth } from "~/lib/auth.server";
import { useAuth } from "~/hooks/useAuth";
import { KimuLogo } from "~/components/ui/KimuLogo";

export async function loader({ request }: Route.LoaderArgs) {
  // If already authenticated, redirect to projects
  try {
    // @ts-ignore
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const uid: string | undefined = session?.user?.id || session?.userId || session?.session?.userId;
    if (uid) return new Response(null, { status: 302, headers: { Location: "/projects" } });
  } catch {}
  return null;
}

export default function LoginPage() {
  const { isSigningIn, signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen w-full relative bg-background">
      {/* Editor-like background */}
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Minimal top bar */}
      <header className="h-12 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center gap-2 px-4">
        <KimuLogo className="h-5 w-5" />
        <span className="text-sm font-medium">Kimu Studio</span>
      </header>

      {/* Auth overlay */}
      <AuthOverlay isLoading={false} isSigningIn={isSigningIn} onSignIn={signInWithGoogle} />
    </div>
  );
}


