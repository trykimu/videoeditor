import React, { useCallback, useRef, useState } from "react";
import { Diamond, Plus, Trash2 } from "lucide-react";
import { KEYFRAME_LANE_HEIGHT, type Keyframe, type ScrubberState } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

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

export interface KeyframeLanesProps {
  scrubber: ScrubberState;
  timelineWidth: number;
  pixelsPerSecond: number;
  rulerPositionPx: number;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
  onUpdateKeyframe: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDeleteKeyframe: (scrubberId: string, property: string, timeInSeconds: number) => void;
  onRemoveProperty?: (scrubberId: string, property: string) => void;
}

export function KeyframeLanes({
  scrubber,
  timelineWidth,
  pixelsPerSecond,
  rulerPositionPx,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onRemoveProperty,
}: KeyframeLanesProps) {
  const tracks = scrubber.keyframes?.tracks ?? [];
  const clipStartSec = scrubber.left / pixelsPerSecond;
  const clipEndSec = (scrubber.left + scrubber.width) / pixelsPerSecond;
  const laneCount = Math.max(1, tracks.length);

  const addAtPlayhead = useCallback(
    (property: Property) => {
      const t = Math.min(clipEndSec, Math.max(clipStartSec, rulerPositionPx / pixelsPerSecond));
      onAddKeyframe(scrubber.id, property, {
        timeInSeconds: t,
        value: PROPERTY_DEFAULTS[property],
        easing: "linear",
      });
    },
    [scrubber.id, clipStartSec, clipEndSec, rulerPositionPx, pixelsPerSecond, onAddKeyframe],
  );

  const existing = new Set(tracks.map((t) => t.property));
  const available = PROPERTIES.filter((p) => !existing.has(p));

  return (
    <div
      className="absolute left-0 z-[25] pointer-events-auto"
      style={{ width: timelineWidth, height: laneCount * KEYFRAME_LANE_HEIGHT }}
      data-keyframe-lanes
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}>
      {/* Clip bounds highlight */}
      <div
        className="absolute inset-y-0 rounded-sm bg-primary/[0.06] border-y border-primary/20 pointer-events-none"
        style={{ left: scrubber.left, width: scrubber.width }}
      />

      {/* Playhead in keyframe area */}
      <div
        className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none"
        style={{ left: rulerPositionPx }}
      />

      {tracks.length === 0 ? (
        <EmptyKeyframeLane available={available} onAdd={addAtPlayhead} />
      ) : (
        tracks.map((kt) => (
          <PropertyLane
            key={kt.property}
            scrubber={scrubber}
            property={kt.property}
            keyframes={kt.keyframes}
            pixelsPerSecond={pixelsPerSecond}
            clipStartSec={clipStartSec}
            clipEndSec={clipEndSec}
            rulerPositionPx={rulerPositionPx}
            onAddKeyframe={onAddKeyframe}
            onUpdateKeyframe={onUpdateKeyframe}
            onDeleteKeyframe={onDeleteKeyframe}
            onRemoveProperty={onRemoveProperty}
          />
        ))
      )}
    </div>
  );
}

function EmptyKeyframeLane({
  available,
  onAdd,
}: {
  available: Property[];
  onAdd: (p: Property) => void;
}) {
  return (
    <div
      className="relative flex items-center gap-2 px-3 border-t border-border/40 bg-muted/20"
      style={{ height: KEYFRAME_LANE_HEIGHT }}>
      <span className="text-[10px] text-muted-foreground shrink-0">Keyframes</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
            <Plus className="h-3 w-3" />
            Add property
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[120px]">
          {available.map((p) => (
            <DropdownMenuItem key={p} className="text-xs capitalize" onClick={() => onAdd(p)}>
              {p}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function PropertyLane({
  scrubber,
  property,
  keyframes,
  pixelsPerSecond,
  clipStartSec,
  clipEndSec,
  rulerPositionPx,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onRemoveProperty,
}: {
  scrubber: ScrubberState;
  property: string;
  keyframes: Keyframe[];
  pixelsPerSecond: number;
  clipStartSec: number;
  clipEndSec: number;
  rulerPositionPx: number;
  onAddKeyframe: KeyframeLanesProps["onAddKeyframe"];
  onUpdateKeyframe: KeyframeLanesProps["onUpdateKeyframe"];
  onDeleteKeyframe: KeyframeLanesProps["onDeleteKeyframe"];
  onRemoveProperty?: KeyframeLanesProps["onRemoveProperty"];
}) {
  const addHere = useCallback(() => {
    const t = Math.min(clipEndSec, Math.max(clipStartSec, rulerPositionPx / pixelsPerSecond));
    onAddKeyframe(scrubber.id, property, {
      timeInSeconds: t,
      value: PROPERTY_DEFAULTS[property as Property] ?? 0,
      easing: "linear",
    });
  }, [scrubber.id, property, clipStartSec, clipEndSec, rulerPositionPx, pixelsPerSecond, onAddKeyframe]);

  return (
    <div
      className="relative border-t border-border/40 bg-muted/15"
      style={{ height: KEYFRAME_LANE_HEIGHT }}>
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 z-[1] flex items-center gap-1 rounded-r-md bg-background/90 border border-border/60 px-1.5 py-0.5 shadow-sm pointer-events-none"
        style={{ left: Math.max(0, scrubber.left - 2), maxWidth: 88 }}>
        <span className="text-[9px] font-medium capitalize text-muted-foreground truncate">{property}</span>
      </div>

      {keyframes.map((kf) => (
        <KeyframeMarker
          key={`${property}-${kf.timeInSeconds}`}
          keyframe={kf}
          scrubberId={scrubber.id}
          property={property}
          pixelsPerSecond={pixelsPerSecond}
          clipStartSec={clipStartSec}
          clipEndSec={clipEndSec}
          onUpdate={onUpdateKeyframe}
          onDelete={onDeleteKeyframe}
        />
      ))}

      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-[2]"
        style={{ left: scrubber.left + scrubber.width + 6 }}>
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary/50 transition-colors"
          onClick={addHere}
          title={`Add ${property} keyframe at playhead`}>
          <Plus className="h-3 w-3" />
        </button>
        {onRemoveProperty && (
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            onClick={() => onRemoveProperty(scrubber.id, property)}
            title={`Remove ${property} lane`}>
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function KeyframeMarker({
  keyframe,
  scrubberId,
  property,
  pixelsPerSecond,
  clipStartSec,
  clipEndSec,
  onUpdate,
  onDelete,
}: {
  keyframe: Keyframe;
  scrubberId: string;
  property: string;
  pixelsPerSecond: number;
  clipStartSec: number;
  clipEndSec: number;
  onUpdate: KeyframeLanesProps["onUpdateKeyframe"];
  onDelete: KeyframeLanesProps["onDeleteKeyframe"];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(keyframe.value));
  const dragRef = useRef({ active: false, startX: 0, startTime: 0 });
  const elRef = useRef<HTMLButtonElement>(null);

  const x = keyframe.timeInSeconds * pixelsPerSecond;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.detail === 2) {
        setDraft(String(keyframe.value));
        setEditing(true);
        return;
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { active: true, startX: e.clientX, startTime: keyframe.timeInSeconds };

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current.active) return;
        const dx = ev.clientX - dragRef.current.startX;
        const newTime = Math.min(
          clipEndSec,
          Math.max(clipStartSec, dragRef.current.startTime + dx / pixelsPerSecond),
        );
        if (elRef.current) {
          elRef.current.style.left = `${newTime * pixelsPerSecond}px`;
        }
        onUpdate(scrubberId, property, keyframe.timeInSeconds, { ...keyframe, timeInSeconds: newTime });
      };

      const onUp = () => {
        dragRef.current.active = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [keyframe, scrubberId, property, pixelsPerSecond, clipStartSec, clipEndSec, onUpdate],
  );

  const commitEdit = useCallback(() => {
    const num = parseFloat(draft);
    if (!Number.isNaN(num)) {
      onUpdate(scrubberId, property, keyframe.timeInSeconds, { ...keyframe, value: num });
    }
    setEditing(false);
  }, [draft, keyframe, scrubberId, property, onUpdate]);

  return (
    <>
      <button
        ref={elRef}
        type="button"
        className={cn(
          "absolute top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2",
          "flex h-4 w-4 items-center justify-center rounded-sm",
          "bg-primary text-primary-foreground shadow-sm border border-primary-foreground/20",
          "cursor-grab active:cursor-grabbing hover:scale-110 transition-transform",
        )}
        style={{ left: x }}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => {
          e.preventDefault();
          onDelete(scrubberId, property, keyframe.timeInSeconds);
        }}
        title={`${property}: ${keyframe.value} @ ${keyframe.timeInSeconds.toFixed(2)}s — double-click to edit, right-click to delete`}>
        <Diamond className="h-2.5 w-2.5 fill-current" />
      </button>

      {editing && (
        <div
          className="absolute z-[60] flex items-center gap-1.5 rounded-md border border-border bg-popover px-2 py-1.5 shadow-lg"
          style={{ left: Math.max(8, x - 40), top: -40 }}
          onPointerDown={(e) => e.stopPropagation()}>
          <span className="text-[10px] capitalize text-muted-foreground">{property}</span>
          <input
            autoFocus
            className="w-16 rounded border border-border bg-muted px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        </div>
      )}
    </>
  );
}

export { PROPERTIES as KEYFRAME_PROPERTIES };
