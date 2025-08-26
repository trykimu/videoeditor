import type { Route } from "./+types/login";
import React from "react";
import { auth } from "~/lib/auth.server";
import { useAuth } from "~/hooks/useAuth";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { Clapperboard, Wand2, Scissors } from "lucide-react";
import { FaGoogle } from "react-icons/fa";

export async function loader({ request }: Route.LoaderArgs) {
  // If already authenticated, redirect to projects
  try {
    // @ts-ignore
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const uid: string | undefined = (session as any)?.user?.id || (session as any)?.session?.user?.id || (session as any)?.userId;
    if (uid) return new Response(null, { status: 302, headers: { Location: "/projects" } });
  } catch {}
  return null;
}

export default function LoginPage() {
  const { isSigningIn, signInWithGoogle } = useAuth();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Animated timeline grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 72px)",
          backgroundSize: "auto",
        }}
      />

      {/* Accent radial glows (multi-hue) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-24 h-[48vw] w-[48vw] rounded-full blur-3xl mix-blend-screen bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),transparent_65%)]" />
        <div className="absolute -right-24 top-[-10%] h-[40vw] w-[40vw] rounded-full blur-3xl mix-blend-screen bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.20),transparent_65%)]" />
        <div className="absolute -left-20 bottom-[-10%] h-[38vw] w-[38vw] rounded-full blur-3xl mix-blend-screen bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_65%)]" />
        <div className="absolute -right-36 bottom-[-12%] h-[46vw] w-[46vw] rounded-full blur-3xl mix-blend-screen bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.20),transparent_65%)]" />
      </div>

      {/* Sweeping playhead */}
      <div className="absolute inset-y-0 -z-10" style={{ animation: "sweep 14s linear infinite" }}>
        <div className="absolute top-0 bottom-0 w-px bg-primary/70" />
        <div className="absolute top-0 bottom-0 w-[3px] translate-x-[-1px] bg-primary/30 blur-[1px]" />
      </div>

      {/* Floating editor artifacts */}
      <Clapperboard aria-hidden className="absolute left-10 top-16 h-6 w-6 text-primary/30 animate-[float_8s_ease-in-out_infinite]" />
      <Wand2 aria-hidden className="absolute right-12 top-24 h-5 w-5 text-primary/30 animate-[float_9s_ease-in-out_infinite] [animation-delay:2s]" />
      <Scissors aria-hidden className="absolute left-1/2 bottom-16 h-5 w-5 text-primary/30 animate-[float_10s_ease-in-out_infinite] [animation-delay:1s]" />

      {/* Centerpiece orb */}
      <main className="relative grid place-items-center px-4 min-h-screen">
        <div className="relative grid place-items-center">
          <div className="relative h-80 w-80 rounded-full border border-border/40 bg-background/25 backdrop-blur-2xl transition-transform duration-700 will-change-transform hover:scale-[1.02]">
            {/* Outer halo */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full blur-3xl opacity-70" style={{
              background: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.28), transparent 55%)",
              animation: "pulse 6s ease-in-out infinite",
            }} />
            {/* Soft inner glow */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.16),transparent_70%)]" />
            {/* Rotating multi-hue sheen (single cycle) */}
            <div className="absolute inset-0 rounded-full opacity-80" style={{
              background: "conic-gradient(from_0deg, rgba(99,102,241,0.16), rgba(236,72,153,0.10), rgba(56,189,248,0.12), rgba(34,197,94,0.10), rgba(99,102,241,0.16))",
              animation: "spin 28s linear infinite",
            }} />
            {/* Concentric ring lines (static) */}
            <div className="absolute inset-0 rounded-full opacity-25 [mask-image:radial-gradient(circle,transparent_56%,black_60%,black_72%,transparent_76%)] bg-[conic-gradient(from_0deg,rgba(255,255,255,0.22),transparent_10%,transparent_38%,rgba(255,255,255,0.22),transparent_60%,transparent_88%,rgba(255,255,255,0.22))]" />
            {/* Specular highlight */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.10),transparent_55%)]" />
            <div className="relative z-10 grid h-full w-full place-items-center">
              <KimuLogo className="h-14 w-14" />
            </div>
          </div>
          <h1 className="mt-6 text-lg font-semibold tracking-tight">Welcome to Kimu</h1>
          <p className="mt-1 text-xs text-muted-foreground">Cinematic editing, reimagined.</p>
          <div className="mt-6 w-full max-w-sm">
            <button onClick={signInWithGoogle} disabled={!!isSigningIn} className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm">
              {isSigningIn ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
                  Signing in...
                </>
              ) : (
                <>
                  <FaGoogle className="h-4 w-4" />
                  Continue with Google
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">We never post on your behalf.</p>
        </div>
      </main>

      {/* Local keyframes and bokeh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" style={{
        backgroundImage: "repeating-radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0 1px, transparent 2px 28px), repeating-radial-gradient(circle at 80% 60%, rgba(255,255,255,0.5) 0 1px, transparent 2px 36px)",
      }} />
      <style>{`
        @keyframes sweep { 0% { left: -10%; } 100% { left: 110%; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: .55; transform: scale(0.98); } 50% { opacity: .85; transform: scale(1.03); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}


