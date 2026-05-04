import React from "react";
import { Trash2, Volume2, VolumeX } from "lucide-react";
import {
  DEFAULT_TRACK_HEIGHT,
  RULER_HEIGHT,
  TRACK_LABEL_WIDTH,
  type TrackState,
} from "../types";

interface TrackLabelColumnProps {
  tracks: TrackState[];
  scrollTop: number;
  expandedIds: Set<string>;
  getTrackVisualHeight: (track: TrackState) => number;
  onDeleteTrack: (trackId: string) => void;
  onToggleMute: (trackId: string) => void;
  onToggleKeyframeLanes: (scrubberId: string) => void;
  onSetTrackName: (trackId: string, name: string) => void;
}

export function TrackLabelColumn({
  tracks,
  scrollTop,
  expandedIds,
  getTrackVisualHeight,
  onDeleteTrack,
  onToggleMute,
  onToggleKeyframeLanes,
  onSetTrackName,
}: TrackLabelColumnProps) {
  return (
    <div
      className="flex-shrink-0 flex flex-col border-r border-border bg-background z-10"
      style={{ width: TRACK_LABEL_WIDTH }}>
      {/* Ruler-height header */}
      <div
        className="flex-shrink-0 border-b border-border flex items-center px-3"
        style={{ height: RULER_HEIGHT }}>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tracks</span>
      </div>

      {/* Track rows — translateY-synced to scroll */}
      <div className="flex-1 overflow-hidden relative">
        <div style={{ transform: `translateY(-${scrollTop}px)` }}>
          {tracks.map((track, trackIndex) => {
            const rowHeight = getTrackVisualHeight(track);
            const hasExpandedScrubbers = track.scrubbers.some((s) => expandedIds.has(s.id));

            return (
              <div
                key={track.id}
                className="border-b border-border/50 flex flex-col"
                style={{ height: rowHeight }}>
                {/* Main track row */}
                <div
                  className="flex items-center gap-1 px-2"
                  style={{ height: DEFAULT_TRACK_HEIGHT }}>
                  {/* Track name */}
                  <TrackNameEditor
                    name={track.name ?? `Track ${trackIndex + 1}`}
                    onChange={(name) => onSetTrackName(track.id, name)}
                  />

                  {/* Mute button */}
                  <button
                    className={`flex-shrink-0 p-1 rounded transition-colors ${
                      track.muted
                        ? "text-yellow-500 hover:text-yellow-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onToggleMute(track.id)}
                    title={track.muted ? "Unmute track" : "Mute track"}>
                    {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>

                  {/* Delete track */}
                  <button
                    className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => onDeleteTrack(track.id)}
                    title="Delete track">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Keyframe lane sub-rows */}
                {track.scrubbers
                  .filter((s) => expandedIds.has(s.id))
                  .map((s) => {
                    const laneCount = Math.max(1, s.keyframes?.tracks.length ?? 0);
                    return s.keyframes?.tracks.map((kt, ki) => (
                      <div
                        key={`${s.id}-${kt.property}`}
                        className="flex items-center px-3 border-t border-border/30 text-[10px] text-muted-foreground"
                        style={{ height: 24 }}>
                        <span className="capitalize opacity-70">{kt.property}</span>
                      </div>
                    )) ?? (
                      <div
                        key={`${s.id}-empty`}
                        className="flex items-center px-3 border-t border-border/30 text-[10px] text-muted-foreground"
                        style={{ height: 24 }}>
                        <span className="opacity-50">No keyframes</span>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
