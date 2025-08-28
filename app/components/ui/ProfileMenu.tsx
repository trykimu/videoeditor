import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Star, HardDrive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";

type UserLike = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function ProfileMenu({
  user,
  starCount,
  onSignOut,
}: {
  user: UserLike;
  starCount: number | null;
  onSignOut: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [usedBytes, setUsedBytes] = React.useState<number | null>(null);
  const [limitBytes, setLimitBytes] = React.useState<number>(
    2 * 1024 * 1024 * 1024
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/storage", { credentials: "include" });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) {
          const u = Number(j?.usedBytes || 0);
          const l = Number(j?.limitBytes || limitBytes);
          setUsedBytes(Number.isFinite(u) ? u : 0);
          setLimitBytes(Number.isFinite(l) ? l : 2 * 1024 * 1024 * 1024);
        }
      } catch {
        console.error("Storage fetch failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"] as const;
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    const val = bytes / Math.pow(1024, i);
    return `${val >= 100 ? Math.round(val) : val.toFixed(1)} ${units[i]}`;
  }

  const GitHubIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );

  const DiscordIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );

  const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2H21l-6.6 7.548L22 22h-6.8l-4.4-5.8L5.6 22H3l7.2-8.24L2 2h6.8l4 5.4L18.244 2Zm-1.2 18h1.88L8.08 4H6.2l10.844 16Z" />
    </svg>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-6 w-6 rounded-full overflow-hidden border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/30 relative ml-1">
          <div className="absolute inset-0 bg-muted flex items-center justify-center text-[10px] font-medium">
            {(user.name ?? user.email ?? "").slice(0, 1).toUpperCase()}
          </div>
          {user.image && (
            <img
              src={user.image}
              alt={user.name ?? user.email ?? "Profile"}
              className="h-full w-full object-cover relative z-10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              referrerPolicy="no-referrer"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {user.name || user.email || "Signed in"}
        </div>
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <button
            className="w-full flex items-center gap-2 text-xs"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            Switch theme
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
          Socials
        </DropdownMenuLabel>
        <div className="px-0 pb-2">
          <div className="flex items-center justify-center gap-1">
            <DropdownMenuItem asChild className="p-0">
              <a
                href="https://github.com/trykimu/videoeditor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 rounded-md border border-border/40 px-3 hover:bg-accent/30 focus:bg-accent/30 focus:outline-none transition-colors"
                title="GitHub"
              >
                <span className="inline-flex items-center justify-center gap-1 leading-none">
                  <GitHubIcon className="h-3 w-3 shrink-0" />
                  <Star className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-[10px] text-muted-foreground leading-none">
                    {starCount !== null ? starCount.toLocaleString() : "..."}
                  </span>
                </span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="p-0">
              <a
                href="https://discord.gg/24Mt5DGcbx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-14 h-8 rounded-md border border-border/40 px-2 hover:bg-accent/30 focus:bg-accent/30 focus:outline-none transition-colors"
                title="Discord"
              >
                <DiscordIcon className="h-3.5 w-3.5" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="p-0">
              <a
                href="https://x.com/trykimu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-14 h-8 rounded-md border border-border/40 px-2 hover:bg-accent/30 focus:bg-accent/30 focus:outline-none transition-colors"
                title="X (Twitter)"
              >
                <XIcon className="h-3.5 w-3.5" />
              </a>
            </DropdownMenuItem>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
          Cloud Storage
        </DropdownMenuLabel>
        <div className="px-2 pb-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              Storage
            </span>
            <span className="font-mono">
              {usedBytes === null
                ? "..."
                : `${formatBytes(usedBytes)} / ${formatBytes(limitBytes)}`}
            </span>
          </div>
          {
            <Progress
              // @ts-ignore radix root value
              value={
                usedBytes !== null && limitBytes > 0
                  ? Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100))
                  : 0
              }
            />
          }
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onSignOut();
            setTimeout(() => {
              window.location.href = "/";
            }, 100);
          }}
          variant="destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
