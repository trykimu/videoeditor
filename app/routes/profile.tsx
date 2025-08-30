import React from "react";
import { useAuth } from "~/hooks/useAuth";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, HardDrive, FolderOpen, Calendar, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Progress } from "~/components/ui/progress";

export default function Profile() {
  const { user } = useAuth();
  const { theme, setTheme, systemTheme } = useTheme();
  const [usedBytes, setUsedBytes] = React.useState<number | null>(null);
  const [limitBytes, setLimitBytes] = React.useState<number>(2 * 1024 * 1024 * 1024);
  const [projectCount, setProjectCount] = React.useState<number | null>(null);
  const [memberSince, setMemberSince] = React.useState<string | null>(null);

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
      } catch (error) {
        console.error('Failed to fetch storage info:', error);
      }
    })();
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (!res.ok) return;
        const j = await res.json();
        const created = j?.user?.createdAt || j?.user?.created_at || j?.user?.created_at_ms || null;
        if (!cancelled && created) setMemberSince(String(created));
      } catch (error) {
        console.error('Failed to fetch user session:', error);
      }
    })();
    (async () => {
      try {
        const res = await fetch("/api/projects", { credentials: "include" });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setProjectCount(Array.isArray(j?.projects) ? j.projects.length : 0);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limitBytes]);

  const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"] as const;
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const val = bytes / Math.pow(1024, i);
    return `${val >= 100 ? Math.round(val) : val.toFixed(1)} ${units[i]}`;
  };

  return (
    <div className="min-h-screen w-full bg-background pt-16 sm:pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <button
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.href = "/projects";
            }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.image || "/kimu.svg"}
              alt="avatar"
              className="h-16 w-16 rounded-full border border-border object-cover"
            />
            <div>
              <h1 className="text-xl font-semibold">{user?.name || "User"}</h1>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <div className="text-sm text-muted-foreground">Theme</div>
            <Select
              value={theme === "light" || theme === "dark" ? theme : "system"}
              onValueChange={(v: 'light' | 'dark' | 'system') => setTheme(v)}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <span className="inline-flex items-center gap-2">
                    <Sun className="size-4" /> Light
                  </span>
                </SelectItem>
                <SelectItem value="dark">
                  <span className="inline-flex items-center gap-2">
                    <Moon className="size-4" /> Dark
                  </span>
                </SelectItem>
                <SelectItem value="system">
                  <span className="inline-flex items-center gap-2">
                    <Monitor className="size-4" /> System
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-2 inline-flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Total storage used
            </div>
            <div className="text-2xl font-semibold">
              {usedBytes === null ? "—" : `${formatBytes(usedBytes)} / ${formatBytes(limitBytes)}`}
            </div>
            <div className="mt-3">
              <Progress
                // @ts-ignore radix value type
                value={
                  usedBytes !== null && limitBytes > 0 ? Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100)) : 0
                }
              />
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> Projects
            </div>
            <div className="text-2xl font-semibold mt-1">{projectCount === null ? "—" : projectCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Member since
            </div>
            <div className="text-2xl font-semibold mt-1">
              {memberSince ? new Date(memberSince).toLocaleDateString() : "—"}
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button variant="outline">Manage Subscription</Button>
        </div>
      </div>
    </div>
  );
}
