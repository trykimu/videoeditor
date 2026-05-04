import React, { useCallback, useState, useRef } from "react";
import { KEYFRAME_LANE_HEIGHT } from "../types";
import type { KeyframeTrack, Keyframe, ScrubberState } from "../types";
import { Plus, X } from "lucide-react";

const PROPERTIES = ["opacity", "scale", "x", "y", "rotation", "volume"] as const;
type Property = (typeof PROPERTIES)[number];

const PROPERTY_DEFAULTS: Record<Property, number> = {
  opacity: 1,
  scale: 1,
  x: 0,
  y: 0,
  rotation: 0,
  volume: 1,
};

interface KeyframeLaneRowProps {
  scrubber: ScrubberState;
  pixelsPerSecond: number;
  rulerPositionPx: number;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
  onUpdateKeyframe: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDeleteKeyframe: (scrubberId: string, property: string, timeInSeconds: number) => void;
}

export function KeyframeLaneRow({
  scrubber,
  pixelsPerSecond,
  rulerPositionPx,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
}: KeyframeLaneRowProps) {
  const tracks = scrubber.keyframes?.tracks ?? [];

  const addAtPlayhead = useCallback(
    (property: Property) => {
      const timeInSeconds = rulerPositionPx / pixelsPerSecond;
      onAddKeyframe(scrubber.id, property, {
        timeInSeconds,
        value: PROPERTY_DEFAULTS[property],
        easing: "linear",
      });
    },
    [scrubber.id, rulerPositionPx, pixelsPerSecond, onAddKeyframe],
  );

  if (tracks.length === 0) {
    return <EmptyLane onAdd={addAtPlayhead} />;
  }

  return (
    <>
      {tracks.map((kt) => (
        <KeyframeSingleLane
          key={kt.property}
          scrubber={scrubber}
          track={kt}
          pixelsPerSecond={pixelsPerSecond}
          rulerPositionPx={rulerPositionPx}
          onAddKeyframe={onAddKeyframe}
          onUpdateKeyframe={onUpdateKeyframe}
          onDeleteKeyframe={onDeleteKeyframe}
        />
      ))}
    </>
  );
}

// ─── Empty state: property picker ────────────────────────────────────────────

function EmptyLane({ onAdd }: { onAdd: (p: Property) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative border-t border-border/30 bg-muted/10 flex items-center px-2 gap-1"
      style={{ height: KEYFRAME_LANE_HEIGHT }}>
      <span className="text-[10px] text-muted-foreground mr-1">Add keyframe:</span>
      {open ? (
        <>
          {PROPERTIES.map((p) => (
            <button
              key={p}
              className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
              onClick={() => { onAdd(p); setOpen(false); }}>
              {p}
            </button>
          ))}
          <button
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}>
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <button
          className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen(true)}>
          <Plus className="h-3 w-3" />
          <span>choose property</span>
        </button>
      )}
    </div>
  );
}

// ─── Single property lane ─────────────────────────────────────────────────────

function KeyframeSingleLane({
  scrubber,
  track,
  pixelsPerSecond,
  rulerPositionPx,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
}: {
  scrubber: ScrubberState;
  track: KeyframeTrack;
  pixelsPerSecond: number;
  rulerPositionPx: number;
  onAddKeyframe: KeyframeLaneRowProps["onAddKeyframe"];
  onUpdateKeyframe: KeyframeLaneRowProps["onUpdateKeyframe"];
  onDeleteKeyframe: KeyframeLaneRowProps["onDeleteKeyframe"];
}) {
  const addHere = useCallback(() => {
    const timeInSeconds = rulerPositionPx / pixelsPerSecond;
    onAddKeyframe(scrubber.id, track.property, {
      timeInSeconds,
      value: PROPERTY_DEFAULTS[track.property as Property] ?? 0,
      easing: "linear",
    });
  }, [scrubber.id, track.property, rulerPositionPx, pixelsPerSecond, onAddKeyframe]);

  return (
    <div
      className="relative border-t border-border/30 bg-muted/10 flex items-center"
      style={{ height: KEYFRAME_LANE_HEIGHT }}>

      {track.keyframes.map((kf) => (
        <KeyframeDiamond
          key={kf.timeInSeconds}
          keyframe={kf}
          scrubber={scrubber}
          property={track.property}
          pixelsPerSecond={pixelsPerSecond}
          onUpdate={onUpdateKeyframe}
          onDelete={onDeleteKeyframe}
        />
      ))}

      {/* + button: add keyframe at playhead for this property */}
      <button
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors z-10"
        onClick={addHere}
        title={`Add ${track.property} keyframe at playhead`}>
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ─── Diamond marker ───────────────────────────────────────────────────────────

function KeyframeDiamond({
  keyframe,
  scrubber,
  property,
  pixelsPerSecond,
  onUpdate,
  onDelete,
}: {
  keyframe: Keyframe;
  scrubber: ScrubberState;
  property: string;
  pixelsPerSecond: number;
  onUpdate: KeyframeLaneRowProps["onUpdateKeyframe"];
  onDelete: KeyframeLaneRowProps["onDeleteKeyframe"];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(keyframe.value));
  const dragRef = useRef({ active: false, startX: 0, startTime: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  // Position relative to the scrubber's left edge
  const x = keyframe.timeInSeconds * pixelsPerSecond - scrubber.left;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.button === 2) {
        onDelete(scrubber.id, property, keyframe.timeInSeconds);
        return;
      }
      if (e.detail === 2) {
        // double-click → open editor
        setDraft(String(keyframe.value));
        setEditing(true);
        return;
      }

      dragRef.current = { active: true, startX: e.clientX, startTime: keyframe.timeInSeconds };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current.active) return;
        const dx = ev.clientX - dragRef.current.startX;
        const newTime = Math.max(
          scrubber.left / pixelsPerSecond,
          dragRef.current.startTime + dx / pixelsPerSecond,
        );
        // Live DOM update for smooth feel
        if (elRef.current) {
          const newX = newTime * pixelsPerSecond - scrubber.left;
          elRef.current.style.left = `${newX}px`;
        }
        onUpdate(scrubber.id, property, keyframe.timeInSeconds, { ...keyframe, timeInSeconds: newTime });
      };

      const onUp = () => {
        dragRef.current.active = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [keyframe, scrubber, property, pixelsPerSecond, onUpdate, onDelete],
  );

  const commitEdit = useCallback(() => {
    const num = parseFloat(draft);
    if (!isNaN(num)) {
      onUpdate(scrubber.id, property, keyframe.timeInSeconds, { ...keyframe, value: num });
    }
    setEditing(false);
  }, [draft, keyframe, scrubber.id, property, onUpdate]);

  return (
    <>
      <div
        ref={elRef}
        className="absolute z-10 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
        style={{
          left: x,
          top: "50%",
          width: 8,
          height: 8,
          transform: "translate(-50%, -50%) rotate(45deg)",
          backgroundColor: "hsl(var(--primary))",
          border: "1px solid hsl(var(--primary-foreground)/0.3)",
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => {
          e.preventDefault();
          onDelete(scrubber.id, property, keyframe.timeInSeconds);
        }}
        title={`${property}: ${keyframe.value} @ ${keyframe.timeInSeconds.toFixed(2)}s — double-click to edit`}
      />

      {/* Inline value editor — floats above the diamond */}
      {editing && (
        <div
          className="absolute z-50 bg-popover border border-border rounded shadow-md px-2 py-1 flex items-center gap-1"
          style={{ left: Math.max(0, x - 30), top: -36, minWidth: 80 }}
          onMouseDown={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-muted-foreground capitalize">{property}:</span>
          <input
            autoFocus
            className="w-14 text-xs bg-muted border border-border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <button
            className="text-muted-foreground hover:text-destructive"
            onMouseDown={(e) => { e.preventDefault(); onDelete(scrubber.id, property, keyframe.timeInSeconds); }}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
}
