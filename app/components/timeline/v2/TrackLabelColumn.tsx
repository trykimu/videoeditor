import React from "react";
import { Diamond, Eye, EyeOff, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import {
  DEFAULT_TRACK_HEIGHT,
  KEYFRAME_LANE_HEIGHT,
  RULER_HEIGHT,
  TRACK_LABEL_WIDTH,
  type TrackState,
  type ScrubberState,
} from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  getKeyframeBlockTopWithinTrack,
  getKeyframeLaneCount,
  sortScrubbersOnTrack,
} from "./keyframe-layout";
import { KEYFRAME_PROPERTIES } from "./KeyframeLanes";

interface TrackLabelColumnProps {
  tracks: TrackState[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  expandedIds: Set<string>;
  getTrackVisualHeight: (track: TrackState) => number;
  onDeleteTrack: (trackId: string) => void;
  onToggleHidden: (trackId: string) => void;
  onToggleMute: (trackId: string) => void;
  onToggleKeyframeLanes: (scrubberId: string) => void;
  onSetTrackName: (trackId: string, name: string) => void;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: { timeInSeconds: number; value: number; easing: string }) => void;
  rulerPositionPx: number;
  pixelsPerSecond: number;
}

export function TrackLabelColumn({
  tracks,
  scrollRef,
  expandedIds,
  getTrackVisualHeight,
  onDeleteTrack,
  onToggleHidden,
  onToggleMute,
  onToggleKeyframeLanes,
  onSetTrackName,
  onAddKeyframe,
  rulerPositionPx,
  pixelsPerSecond,
}: TrackLabelColumnProps) {
  return (
    <div
      className="flex-shrink-0 flex flex-col border-r border-border bg-background z-10"
      style={{ width: TRACK_LABEL_WIDTH }}>
      <div
        className="flex-shrink-0 border-b border-border flex items-center px-3"
        style={{ height: RULER_HEIGHT }}>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tracks</span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div ref={scrollRef}>
          {tracks.map((track, trackIndex) => {
            const rowHeight = getTrackVisualHeight(track);

            return (
              <div
                key={track.id}
                className="border-b border-border/50 flex flex-col relative"
                style={{ height: rowHeight }}>
                <div
                  className="flex items-center gap-1 px-2"
                  style={{ height: DEFAULT_TRACK_HEIGHT }}>
                  <TrackNameEditor
                    name={track.name ?? `Track ${trackIndex + 1}`}
                    onChange={(name) => onSetTrackName(track.id, name)}
                  />

                  <button
                    type="button"
                    className={`flex-shrink-0 p-1 rounded transition-colors ${
                      track.hidden
                        ? "text-muted-foreground/50 hover:text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onToggleHidden(track.id)}
                    title={
                      track.hidden
                        ? "Show track in preview (timeline stays visible, grayed)"
                        : "Hide from preview (timeline clips stay visible, grayed)"
                    }>
                    {track.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>

                  <button
                    type="button"
                    className={`flex-shrink-0 p-1 rounded transition-colors ${
                      track.muted
                        ? "text-yellow-500 hover:text-yellow-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onToggleMute(track.id)}
                    title={track.muted ? "Unmute track" : "Mute track"}>
                    {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>

                  <button
                    type="button"
                    className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => onDeleteTrack(track.id)}
                    title="Delete track">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {sortScrubbersOnTrack(track)
                  .filter((s) => expandedIds.has(s.id))
                  .map((s) => (
                    <KeyframeLabelBlock
                      key={s.id}
                      scrubber={s}
                      track={track}
                      expandedIds={expandedIds}
                      onToggleKeyframeLanes={onToggleKeyframeLanes}
                      onAddKeyframe={onAddKeyframe}
                      rulerPositionPx={rulerPositionPx}
                      pixelsPerSecond={pixelsPerSecond}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KeyframeLabelBlock({
  scrubber,
  track,
  expandedIds,
  onToggleKeyframeLanes,
  onAddKeyframe,
  rulerPositionPx,
  pixelsPerSecond,
}: {
  scrubber: ScrubberState;
  track: TrackState;
  expandedIds: Set<string>;
  onToggleKeyframeLanes: (id: string) => void;
  onAddKeyframe: TrackLabelColumnProps["onAddKeyframe"];
  rulerPositionPx: number;
  pixelsPerSecond: number;
}) {
  const top = getKeyframeBlockTopWithinTrack(scrubber, track, expandedIds);
  const laneCount = getKeyframeLaneCount(scrubber, expandedIds);
  const tracks = scrubber.keyframes?.tracks ?? [];
  const existing = new Set(tracks.map((t) => t.property));
  const available = KEYFRAME_PROPERTIES.filter((p) => !existing.has(p));

  const clipStartSec = scrubber.left / pixelsPerSecond;
  const clipEndSec = (scrubber.left + scrubber.width) / pixelsPerSecond;

  const addAtPlayhead = (property: (typeof KEYFRAME_PROPERTIES)[number]) => {
    const t = Math.min(clipEndSec, Math.max(clipStartSec, rulerPositionPx / pixelsPerSecond));
    const defaults: Record<string, number> = {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotation: 0,
      volume: 1,
    };
    onAddKeyframe(scrubber.id, property, {
      timeInSeconds: t,
      value: defaults[property] ?? 0,
      easing: "linear",
    });
  };

  if (tracks.length === 0) {
    return (
      <div
        className="absolute left-0 right-0 flex items-center gap-1.5 px-2 border-t border-border/40 bg-muted/25"
        style={{ top, height: KEYFRAME_LANE_HEIGHT }}>
        <button
          type="button"
          className="text-[9px] text-muted-foreground hover:text-foreground truncate max-w-[72px] text-left"
          onClick={() => onToggleKeyframeLanes(scrubber.id)}
          title="Collapse keyframes">
          {scrubber.name}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-auto flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:bg-muted">
              <Plus className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[100px]">
            {available.map((p) => (
              <DropdownMenuItem key={p} className="text-xs capitalize" onClick={() => addAtPlayhead(p)}>
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      {tracks.map((kt, i) => (
        <div
          key={`${scrubber.id}-${kt.property}`}
          className="absolute left-0 right-0 flex items-center gap-1.5 px-2 border-t border-border/40 bg-muted/25"
          style={{
            top: top + i * KEYFRAME_LANE_HEIGHT,
            height: KEYFRAME_LANE_HEIGHT,
          }}>
          {i === 0 && (
            <button
              type="button"
              className="text-[9px] text-muted-foreground hover:text-foreground truncate max-w-[56px] shrink-0 text-left"
              onClick={() => onToggleKeyframeLanes(scrubber.id)}
              title="Collapse keyframes">
              {scrubber.name}
            </button>
          )}
          <Diamond className="h-2.5 w-2.5 shrink-0 text-primary" />
          <span className="text-[10px] font-medium capitalize text-foreground truncate flex-1">
            {kt.property}
          </span>
          <span className="text-[9px] text-muted-foreground tabular-nums">{kt.keyframes.length}</span>
        </div>
      ))}
    </>
  );
}

function TrackNameEditor({
  name,
  onChange,
}: {
  name: string;
  onChange: (name: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim()) onChange(draft.trim());
    else setDraft(name);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="flex-1 min-w-0 text-xs bg-muted border border-border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      className="flex-1 min-w-0 text-xs text-foreground truncate cursor-default"
      onDoubleClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      title="Double-click to rename">
      {name}
    </span>
  );
}
