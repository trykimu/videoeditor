import { useEffect, useState, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useNavigate, type LoaderFunctionArgs } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { ProfileMenu } from "~/components/ui/ProfileMenu";
import { Plus, ChevronDown, ArrowUpDown, CalendarClock, ArrowDownAZ, ArrowUpAZ, Check, Trash2, MoreVertical, Edit3, Wand2, Clapperboard } from "lucide-react";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "~/components/ui/dropdown-menu";
import { Modal } from "~/components/ui/modal";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth.server";

type Project = { id: string; name: string; created_at: string };

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Prefer Better Auth runtime API to avoid SSR fetch cookie issues
    // @ts-ignore
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const uid: string | undefined = session?.user?.id || session?.session?.userId;
    if (!uid) return new Response(null, { status: 302, headers: { Location: "/login" } });
  } catch {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return null;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "name_asc" | "name_desc">("created_desc");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [starCount, setStarCount] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  useEffect(() => {
    if (!user) return; // loader already gates; avoid client redirect loops
  }, [user]);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/robinroy03/videoeditor");
        if (res.ok) {
          const data = await res.json();
          setStarCount(typeof data.stargazers_count === 'number' ? data.stargazers_count : null);
        }
      } catch {
        setStarCount(null);
      }
    };
    fetchStars();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/projects", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setProjects(json.projects || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const create = async (projectName?: string) => {
    const name = (projectName || newProjectName || "Untitled Project").trim().slice(0, 120);
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok || res.status === 201) {
        const { project } = await res.json();
        navigate(`/project/${project.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const sortedProjects = useMemo(() => {
    const arr = [...projects];
    switch (sortBy) {
      case "created_asc":
        return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "name_asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "created_desc":
      default:
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [projects, sortBy]);

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Subtle dotted grid only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:16px_16px]" />
      <header className="h-12 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <KimuLogo className="h-5 w-5" />
          <span className="text-sm font-medium">Kimu Studio</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <ProfileMenu user={{ name: user.name, email: user.email, image: user.image }} starCount={starCount} onSignOut={signOut} />
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Your Projects</h1>
            <span className="text-[11px] text-muted-foreground border border-border/30 rounded-full px-2 py-0.5">{projects.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  Sort
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-[11px]">Sort projects</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("created_desc")} className={`text-xs flex items-center gap-2 ${sortBy === 'created_desc' ? 'text-primary' : ''}`}>
                  {sortBy === 'created_desc' ? <Check className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                  Date (newest first)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created_asc")} className={`text-xs flex items-center gap-2 ${sortBy === 'created_asc' ? 'text-primary' : ''}`}>
                  {sortBy === 'created_asc' ? <Check className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                  Date (oldest first)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name_asc")} className={`text-xs flex items-center gap-2 ${sortBy === 'name_asc' ? 'text-primary' : ''}`}>
                  {sortBy === 'name_asc' ? <Check className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />}
                  Name (A–Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name_desc")} className={`text-xs flex items-center gap-2 ${sortBy === 'name_desc' ? 'text-primary' : ''}`}>
                  {sortBy === 'name_desc' ? <Check className="h-3 w-3" /> : <ArrowDownAZ className="h-3 w-3" />}
                  Name (Z–A)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              <Card key="loading-1" className="h-28 animate-pulse" />,
              <Card key="loading-2" className="h-28 animate-pulse" />,
              <Card key="loading-3" className="h-28 animate-pulse" />,
              <Card key="loading-4" className="h-28 animate-pulse" />,
              <Card key="loading-5" className="h-28 animate-pulse" />,
              <Card key="loading-6" className="h-28 animate-pulse" />,
              <Card key="loading-7" className="h-28 animate-pulse" />,
              <Card key="loading-8" className="h-28 animate-pulse" />,
              <Card key="loading-9" className="h-28 animate-pulse" />,
            ]}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create new project tile - always visible */}
            <Card
              className="p-6 border-dashed border-2 cursor-pointer hover:bg-accent/30 flex items-center justify-center bg-gradient-to-br from-background/80 to-muted/40 transition-transform hover:scale-[1.02]"
              onClick={() => { setNewProjectName(""); setShowCreateModal(true); }}
            >
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-8 w-8 rounded-md border border-border/50 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Create new project</div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Wand2 className="h-3 w-3" /> Start from a blank canvas</div>
                </div>
              </div>
            </Card>
            {projects.length === 0 ? (
              <Card className="p-10 text-center col-span-1 sm:col-span-2 lg:col-span-3">
                <div className="text-sm text-muted-foreground">No projects yet.</div>
                <div className="text-xs text-muted-foreground mt-1">Create your first project to get started.</div>
              </Card>
            ) : (
              sortedProjects.map((p) => (
                <Card key={p.id} className="p-4 border-border/60 bg-card group h-28 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 cursor-pointer flex gap-2" onClick={() => navigate(`/project/${p.id}`)}>
                      <div className="h-8 w-8 rounded-md border border-border/50 flex items-center justify-center shrink-0">
                        <Clapperboard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" title={p.name}>{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-70 hover:opacity-100 text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-xs gap-2" onClick={(e) => {
                          e.stopPropagation();
                          setRenameProjectId(p.id);
                          setRenameValue(p.name);
                        }}>
                          <Edit3 className="h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={async (e) => {
                          e.stopPropagation();
                          const res = await fetch(`/api/projects/${encodeURIComponent(p.id)}`, { method: 'DELETE', credentials: 'include' });
                          if (res.ok) setProjects(prev => prev.filter(x => x.id !== p.id));
                        }}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
      {/* Create Project Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create new project">
        <div className="space-y-3">
          <Input placeholder="Project name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={async () => { await create(); }} disabled={creating || !newProjectName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
      {/* Rename Modal */}
      <Modal open={!!renameProjectId} onClose={() => setRenameProjectId(null)} title="Rename project">
        <div className="space-y-3">
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameProjectId(null)}>Cancel</Button>
            <Button onClick={async () => {
              const id = renameProjectId!;
              const newName = renameValue.trim();
              if (!newName) return;
              const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
              if (res.ok) setProjects(prev => prev.map(x => x.id === id ? { ...x, name: newName } : x));
              setRenameProjectId(null);
            }}>Save</Button>
          </div>
        </div>
      </Modal>
      {/* Playful Kimu mascot: gentle float in the corner; spin with chime on click */}
      <style>{`@keyframes kimu-float { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
      @keyframes kimu-spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }`}</style>
      <div
        className="fixed right-6 bottom-6 z-10 select-none"
        onClick={() => {
          const el = document.getElementById('kimu-mascot');
          if (!el) return;
          // spin
          el.style.animation = 'kimu-spin 0.9s linear';
          setTimeout(() => {
            el.style.animation = 'kimu-float 3.5s ease-in-out infinite';
          }, 950);
          // chime (like landing)
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const make = (freq: number, delay: number, dur: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
              osc.type = 'sine';
              gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + dur);
            };
            make(659.25, 0, 0.25);
            make(783.99, 0.08, 0.22);
            make(987.77, 0.16, 0.18);
          } catch { /* ignore audio errors */ }
        }}
      >
        <KimuLogo id="kimu-mascot" opacity={0.2} className="h-8 w-8 text-foreground drop-shadow-md cursor-pointer" style={{ animation: 'kimu-float 3.5s ease-in-out infinite' }} animated />
      </div>
    </div>
  );
}