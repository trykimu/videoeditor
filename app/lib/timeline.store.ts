import fs from "fs";
import path from "path";

const TIMELINE_DIR = process.env.TIMELINE_DIR || path.resolve("project_data");

function ensureDir(): void {
  if (!fs.existsSync(TIMELINE_DIR)) fs.mkdirSync(TIMELINE_DIR, { recursive: true });
}

function getFilePath(projectId: string): string {
  ensureDir();
  return path.resolve(TIMELINE_DIR, `${projectId}.json`);
}

export type ProjectStateFile = {
  timeline: any;
  textBinItems: any[];
};

function defaultTimeline(): any {
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
    if (parsed && typeof parsed === "object" && ("timeline" in parsed || "textBinItems" in parsed)) {
      return {
        timeline: parsed.timeline ?? defaultTimeline(),
        textBinItems: Array.isArray(parsed.textBinItems) ? parsed.textBinItems : [],
      };
    }
    // legacy file stored just the timeline
    return { timeline: parsed, textBinItems: [] };
  } catch {
    return { timeline: defaultTimeline(), textBinItems: [] };
  }
}

export async function saveProjectState(projectId: string, state: ProjectStateFile): Promise<void> {
  const file = getFilePath(projectId);
  await fs.promises.writeFile(file, JSON.stringify(state), "utf8");
}

// Backwards-compatible helpers
export async function loadTimeline(projectId: string): Promise<any> {
  const state = await loadProjectState(projectId);
  return state.timeline;
}

export async function saveTimeline(projectId: string, timeline: any): Promise<void> {
  const prev = await loadProjectState(projectId);
  await saveProjectState(projectId, { timeline, textBinItems: prev.textBinItems });
}


