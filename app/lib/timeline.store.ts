import fs from "fs";
import path from "path";
import type { MediaBinItem, TimelineState } from "~/components/timeline/types";
import { safeResolvePath, ensureDirectoryExists } from "~/utils/path-security";
import { TimelineStateSchema, MediaBinItemSchema } from "~/schemas/timeline";

const TIMELINE_DIR = process.env.TIMELINE_DIR || path.resolve("project_data");

function ensureDir(): void {
  ensureDirectoryExists(TIMELINE_DIR);
}

function getFilePath(projectId: string): string {
  ensureDir();

  // Validate and sanitize projectId to prevent path traversal
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project ID");
  }

  // Use the utility function to safely resolve the path
  const filePath = safeResolvePath(TIMELINE_DIR, `${projectId}.json`);
  if (!filePath) {
    throw new Error("Invalid project ID format");
  }

  return filePath;
}

export type ProjectStateFile = {
  timeline: TimelineState;
  textBinItems: MediaBinItem[];
};

function defaultTimeline(): TimelineState {
  return {
    tracks: [
      { id: "track-1", scrubbers: [], transitions: [] },
      { id: "track-2", scrubbers: [], transitions: [] },
      { id: "track-3", scrubbers: [], transitions: [] },
      { id: "track-4", scrubbers: [], transitions: [] },
    ],
  };
}

export async function loadProjectState(projectId: string): Promise<ProjectStateFile> {
  const file = getFilePath(projectId);
  try {
    const raw = await fs.promises.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    // Validate modern shape { timeline, textBinItems }
    if (parsed && typeof parsed === "object" && ("timeline" in parsed || "textBinItems" in parsed)) {
      const safeTimeline = TimelineStateSchema.safeParse((parsed as any).timeline);
      const safeTextBinItems = Array.isArray((parsed as any).textBinItems)
        ? (parsed as any).textBinItems
            .map((i: unknown) => (MediaBinItemSchema.safeParse(i).success ? i : null))
            .filter(Boolean)
        : [];
      return {
        timeline: (safeTimeline.success ? safeTimeline.data : defaultTimeline()) as unknown as TimelineState,
        textBinItems: safeTextBinItems as unknown as MediaBinItem[],
      };
    }
    // Legacy file stored just the timeline
    const legacy = TimelineStateSchema.safeParse(parsed);
    return {
      timeline: (legacy.success ? legacy.data : defaultTimeline()) as unknown as TimelineState,
      textBinItems: [],
    };
  } catch {
    return { timeline: defaultTimeline(), textBinItems: [] };
  }
}

export async function saveProjectState(projectId: string, state: ProjectStateFile): Promise<void> {
  const file = getFilePath(projectId);
  const timeline = TimelineStateSchema.parse(state.timeline);
  const textBinItems = state.textBinItems.map((i) => MediaBinItemSchema.parse(i));
  await fs.promises.writeFile(file, JSON.stringify({ timeline, textBinItems }), "utf8");
}

// Backwards-compatible helpers
export async function loadTimeline(projectId: string): Promise<TimelineState> {
  const state = await loadProjectState(projectId);
  return state.timeline;
}

export async function saveTimeline(projectId: string, timeline: TimelineState): Promise<void> {
  const prev = await loadProjectState(projectId);
  await saveProjectState(projectId, {
    timeline,
    textBinItems: prev.textBinItems,
  });
}
