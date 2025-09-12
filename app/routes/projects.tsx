import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useNavigate, type LoaderFunctionArgs } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { ProfileMenu } from "~/components/ui/ProfileMenu";
import {
  Plus,
  ChevronDown,
  ArrowUpDown,
  CalendarClock,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  Trash2,
  MoreVertical,
  Edit3,
  Wand2,
  Clapperboard,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { KimuLogo } from "~/components/ui/KimuLogo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Modal } from "~/components/ui/modal";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "~/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter as ADFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth.server";
import { cn } from "~/lib/utils";

type Project = { id: string; name: string; created_at: string };

const ProjectHoverEffect = ({
  projects,
  onProjectClick,
  onRename,
  onDelete,
  formatDate,
  formatTime,
}: {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
  onRename: (projectId: string, currentName: string) => void;
  onDelete: (projectId: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4")}>
      {projects.map((project, idx) => (
        <div
          key={project.id}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}>
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="pointer-events-none absolute inset-1 h-[calc(100%-8px)] w-[calc(100%-8px)] bg-neutral-900/40 dark:bg-neutral-800/70 rounded-2xl border border-neutral-700/60"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <ProjectCard
            project={project}
            onProjectClick={onProjectClick}
            onRename={onRename}
            onDelete={onDelete}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        </div>
      ))}
    </div>
  );
};

const ProjectCard = ({
  project,
  onProjectClick,
  onRename,
  onDelete,
  formatDate,
  formatTime,
}: {
  project: Project;
  onProjectClick: (projectId: string) => void;
  onRename: (projectId: string, currentName: string) => void;
  onDelete: (projectId: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}) => {
  return (
    <Card
      className={cn(
        "group h-36 border-border/20 bg-card/50 hover:bg-card hover:border-border/30 backdrop-blur-sm transition-all duration-300 cursor-pointer relative overflow-hidden z-20",
      )}
      onClick={() => onProjectClick(project.id)}>
      <div className="p-5 h-full flex flex-col relative">
        {/* Project name */}
        <div className="flex-1 relative z-10">
          <h3
            className="text-lg font-semibold text-foreground leading-tight"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
            {project.name}
          </h3>
        </div>

        {/* Date and time - positioned at very bottom */}
        <div className="space-y-0.5 relative z-10 mt-auto mb-1">
          <p className="text-xs text-muted-foreground font-medium">{formatDate(project.created_at)}</p>
          <p className="text-[10px] text-muted-foreground/70">{formatTime(project.created_at)}</p>
        </div>

        {/* Actions: always visible on mobile, show on hover for desktop */}
        <div className="absolute bottom-0.5 right-0.5 transition-opacity duration-300 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onRename(project.id, project.name);
            }}
            aria-label="Open project actions">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export async function loader({ request }: { request: Request }) {
  try {
    // Prefer Better Auth runtime API to avoid SSR fetch cookie issues
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const uid: string | undefined = session?.user?.id || session?.session?.userId;
    if (!uid)
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDirection, setDrawerDirection] = useState<"right" | "bottom">("right");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      try {
        const isMobile = window.matchMedia("(max-width: 639px)").matches;
        setDrawerDirection(isMobile ? "bottom" : "right");
      } catch {
        console.error("Failed to update drawer direction");
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Format date as "23 Aug 25"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  // Format time as "2:30 PM"
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  useEffect(() => {
    if (!user) return; // loader already gates; avoid client redirect loops
  }, [user]);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/trykimu/videoeditor");
        if (res.ok) {
          const data = await res.json();
          setStarCount(typeof data.stargazers_count === "number" ? data.stargazers_count : null);
        }
      } catch {
        console.error("Failed to fetch star count");
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <header className="h-10 sm:h-12 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <KimuLogo className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium truncate">Kimu Studio</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <ProfileMenu
              user={{ name: user.name, email: user.email, image: user.image }}
              starCount={starCount}
              onSignOut={signOut}
            />
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Your Projects</h1>
            <span className="text-[11px] text-muted-foreground border border-border/30 rounded-full px-2 py-0.5">
              {projects.length}
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                setNewProjectName("");
                setShowCreateModal(true);
              }}
              disabled={creating}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Project
            </Button>
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
                <DropdownMenuItem
                  onClick={() => setSortBy("created_desc")}
                  className={`text-xs flex items-center gap-2 ${sortBy === "created_desc" ? "text-primary" : ""}`}>
                  {sortBy === "created_desc" ? <Check className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                  Date (newest first)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("created_asc")}
                  className={`text-xs flex items-center gap-2 ${sortBy === "created_asc" ? "text-primary" : ""}`}>
                  {sortBy === "created_asc" ? <Check className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                  Date (oldest first)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("name_asc")}
                  className={`text-xs flex items-center gap-2 ${sortBy === "name_asc" ? "text-primary" : ""}`}>
                  {sortBy === "name_asc" ? <Check className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />}
                  Name (A–Z)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("name_desc")}
                  className={`text-xs flex items-center gap-2 ${sortBy === "name_desc" ? "text-primary" : ""}`}>
                  {sortBy === "name_desc" ? <Check className="h-3 w-3" /> : <ArrowDownAZ className="h-3 w-3" />}
                  Name (Z–A)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`loading-${i}`} className="p-2">
                <Card className="h-36 animate-pulse bg-muted/15 border-border/20" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6 border border-border/20">
              <Clapperboard className="h-9 w-9 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-medium text-muted-foreground/80 mb-3">Nothing here yet...</h3>
            <div className="max-w-md space-y-2">
              <p className="text-sm text-muted-foreground/60">Your creative journey starts with a single click!</p>
              <p className="text-sm text-muted-foreground/60">
                Hit that shiny <span className="font-medium text-muted-foreground/80">"New Project"</span> button up
                there to get started.
              </p>
            </div>
          </div>
        ) : (
          <ProjectHoverEffect
            projects={sortedProjects}
            onProjectClick={(projectId) => navigate(`/project/${projectId}`)}
            onRename={(projectId, currentName) => {
              setRenameProjectId(projectId);
              setRenameValue(currentName);
              setDrawerOpen(true);
            }}
            onDelete={async (projectId) => {
              const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
                method: "DELETE",
                credentials: "include",
              });
              if (res.ok) setProjects((prev) => prev.filter((x) => x.id !== projectId));
            }}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
      </main>
      {/* Create Project Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create new project">
        <div className="space-y-3">
          <Input
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await create();
              }}
              disabled={creating || !newProjectName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
      {/* Edit Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={drawerDirection}>
        <DrawerContent>
          <div className="p-4 sm:p-6 h-full flex flex-col gap-4">
            <DrawerHeader>
              <DrawerTitle className="text-base">Edit project</DrawerTitle>
            </DrawerHeader>
            <div className="text-xs text-muted-foreground">
              ID: <span className="font-mono">{renameProjectId}</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Project name</div>
              <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            </div>
            <DrawerFooter className="mt-auto">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    !renameProjectId ||
                    renameValue.trim() === (projects.find((p) => p.id === renameProjectId)?.name || "")
                  }
                  onClick={async () => {
                    const id = renameProjectId!;
                    const newName = renameValue.trim();
                    if (!newName) return;
                    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
                      method: "PATCH",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newName }),
                    });
                    if (res.ok) setProjects((prev) => prev.map((x) => (x.id === id ? { ...x, name: newName } : x)));
                    setDrawerOpen(false);
                  }}>
                  Save
                </Button>
              </div>
              <button
                className="text-destructive flex items-center gap-2 text-sm"
                onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete project
              </button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirm delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <ADFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const id = renameProjectId!;
                if (!id) return;
                const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
                  method: "DELETE",
                  credentials: "include",
                });
                if (res.ok) setProjects((prev) => prev.filter((x) => x.id !== id));
                setConfirmDeleteOpen(false);
                setDrawerOpen(false);
              }}>
              Delete
            </AlertDialogAction>
          </ADFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Playful Kimu mascot: gentle float in the corner; spin with chime on click */}
      <style>{`@keyframes kimu-float { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
      @keyframes kimu-spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }`}</style>
      <div
        className="fixed right-6 bottom-6 z-10 select-none"
        onClick={() => {
          const el = document.getElementById("kimu-mascot");
          if (!el) return;
          // spin
          el.style.animation = "kimu-spin 0.9s linear";
          setTimeout(() => {
            el.style.animation = "kimu-float 3.5s ease-in-out infinite";
          }, 950);
          // chime (like landing)
          try {
            const AudioCtx: typeof AudioContext | undefined =
              (
                window as {
                  AudioContext?: typeof AudioContext;
                  webkitAudioContext?: typeof AudioContext;
                }
              ).AudioContext ||
              (
                window as {
                  AudioContext?: typeof AudioContext;
                  webkitAudioContext?: typeof AudioContext;
                }
              ).webkitAudioContext;
            if (!AudioCtx) throw new Error("AudioContext not supported");
            const ctx = new AudioCtx();
            const make = (freq: number, delay: number, dur: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
              osc.type = "sine";
              gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
              osc.start(ctx.currentTime + delay);
              osc.stop(ctx.currentTime + delay + dur);
            };
            make(659.25, 0, 0.25);
            make(783.99, 0.08, 0.22);
            make(987.77, 0.16, 0.18);
          } catch {
            console.error("Kimu mascot chime failed");
          }
        }}>
        <KimuLogo
          id="kimu-mascot"
          opacity={0.2}
          className="h-8 w-8 text-foreground cursor-pointer"
          style={{ animation: "kimu-float 3.5s ease-in-out infinite" }}
          animated
        />
      </div>
    </div>
  );
}
