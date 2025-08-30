import fs from "fs";
import path from "path";
import type { MediaBinItem, TimelineState } from "~/components/timeline/types";

const TIMELINE_DIR = process.env.TIMELINE_DIR || path.resolve("project_data");

function ensureDir(): void {
  if (!fs.existsSync(TIMELINE_DIR))
    fs.mkdirSync(TIMELINE_DIR, { recursive: true });
}

function getFilePath(projectId: string): string {
  ensureDir();
  // Validate and sanitize projectId to prevent path traversal
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Invalid project ID');
  }
  // Remove any path traversal attempts and invalid characters
  const sanitizedId = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitizedId !== projectId || sanitizedId.length === 0) {
    throw new Error('Invalid project ID format');
  }
  const filePath = path.resolve(TIMELINE_DIR, `${sanitizedId}.json`);
  // Ensure the resolved path is still within TIMELINE_DIR
  if (!filePath.startsWith(path.resolve(TIMELINE_DIR))) {
    throw new Error('Invalid path');
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

export async function loadProjectState(
  projectId: string
): Promise<ProjectStateFile> {
  const file = getFilePath(projectId);
  try {
    const raw = await fs.promises.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      ("timeline" in parsed || "textBinItems" in parsed)
    ) {
      return {
        timeline: parsed.timeline ?? defaultTimeline(),
        textBinItems: Array.isArray(parsed.textBinItems)
          ? parsed.textBinItems
          : [],
      };
    }
    // legacy file stored just the timeline
    return { timeline: parsed, textBinItems: [] };
  } catch {
    return { timeline: defaultTimeline(), textBinItems: [] };
  }
}

export async function saveProjectState(
  projectId: string,
  state: ProjectStateFile
): Promise<void> {
  const file = getFilePath(projectId);
  await fs.promises.writeFile(file, JSON.stringify(state), "utf8");
}

// Backwards-compatible helpers
export async function loadTimeline(projectId: string): Promise<TimelineState> {
  const state = await loadProjectState(projectId);
  return state.timeline;
}

export async function saveTimeline(
  projectId: string,
  timeline: TimelineState
): Promise<void> {
  const prev = await loadProjectState(projectId);
  await saveProjectState(projectId, {
    timeline,
    textBinItems: prev.textBinItems,
  });
}
