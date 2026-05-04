import React, { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from "react";
import { DEFAULT_TRACK_HEIGHT, type ScrubberState } from "./types";
import { Trash2, Group, Ungroup, Archive, Volume2, VolumeX, ChevronDown, ChevronRight } from "lucide-react";
import { useWaveform } from "~/hooks/useWaveform";
import { WaveformCanvas } from "./WaveformCanvas";

export interface SnapConfig {
  enabled: boolean;
  distance: number;
}

export interface ScrubberProps {
  scrubber: ScrubberState;
  timelineWidth: number;
  otherScrubbers: ScrubberState[];
  onUpdate: (updatedScrubber: ScrubberState) => void;
  onDelete?: (scrubberId: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  expandTimeline: () => boolean;
  snapConfig: SnapConfig;
  trackCount: number;
  pixelsPerSecond: number;
  isSelected?: boolean;
  onSelect: (scrubberId: string, ctrlKey: boolean) => void;
  onGroupScrubbers: () => void;
  onUngroupScrubber: (scrubberId: string) => void;
  onMoveToMediaBin?: (scrubberId: string) => void;
  selectedScrubberIds: string[];
  onBeginTransform?: () => void;
  rulerPositionPx?: number;
  onRippleEdit?: (scrubberId: string, originalRightEdgePx: number, deltaPx: number) => void;
  onToggleKeyframeLanes?: (scrubberId: string) => void;
}

const MINIMUM_WIDTH = 20;

export const Scrubber: React.FC<ScrubberProps> = ({
  scrubber,
  timelineWidth,
  otherScrubbers,
  onUpdate,
  onDelete,
  containerRef,
  expandTimeline,
  snapConfig,
  trackCount,
  pixelsPerSecond,
  isSelected = false,
  onSelect,
  onGroupScrubbers,
  onUngroupScrubber,
  onMoveToMediaBin,
  selectedScrubberIds = [],
  onBeginTransform,
  rulerPositionPx,
  onRippleEdit,
  onToggleKeyframeLanes,
}) => {
  const elRef = useRef<HTMLDivElement>(null);

  // isDragging / isResizing are React state only for z-index, cursor, and ring styling.
  // All positional updates happen directly on the DOM element (zero React renders mid-drag).
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // All mutable drag state lives here — never triggers React renders.
  const dragRef = useRef({
    active: false,
    mode: null as null | "drag" | "resize-left" | "resize-right",
    startClientX: 0,
    startClientY: 0,
    startLeft: 0,
    startWidth: 0,
    startTrack: 0,
    currentLeft: 0,
    currentWidth: 0,
    currentTrack: 0,
    altHeld: false,
    rippleOriginalRight: 0,
    snappedEdge: null as null | "left" | "right",
  });

  // Mirror all props that the stable event handlers need — updated via useLayoutEffect
  // so the handlers always see current values without being recreated.
  const propsRef = useRef({
    scrubber,
    onUpdate,
    onSelect,
    onBeginTransform,
    onRippleEdit,
    containerRef,
    expandTimeline,
    snapConfig,
    timelineWidth,
    pixelsPerSecond,
    trackCount,
    rulerPositionPx,
  });
  useLayoutEffect(() => {
    propsRef.current = {
      scrubber,
      onUpdate,
      onSelect,
      onBeginTransform,
      onRippleEdit,
      containerRef,
      expandTimeline,
      snapConfig,
      timelineWidth,
      pixelsPerSecond,
      trackCount,
      rulerPositionPx,
    };
  });

  // Pre-compute snap points — these change infrequently and are read by the stable handler via propsRef.
  const gridSnapPoints = useMemo(() => {
    const pts: number[] = [];
    for (let p = 0; p <= timelineWidth; p += pixelsPerSecond) pts.push(p);
    return pts;
  }, [timelineWidth, pixelsPerSecond]);

  const scrubberSnapPoints = useMemo(
    () => otherScrubbers.map((s) => ({ id: s.id, left: s.left, right: s.left + s.width })),
    [otherScrubbers],
  );

  const snapPointsRef = useRef({ grid: gridSnapPoints, scrubbers: scrubberSnapPoints });
  useLayoutEffect(() => {
    snapPointsRef.current = { grid: gridSnapPoints, scrubbers: scrubberSnapPoints };
  });

  const findSnap = useCallback((position: number, excludeId?: string): number => {
    const { snapConfig, rulerPositionPx } = propsRef.current;
    if (!snapConfig.enabled) return position;
    const d = snapConfig.distance;
    if (rulerPositionPx !== undefined && Math.abs(position - rulerPositionPx) < d) return rulerPositionPx;
    for (const p of snapPointsRef.current.grid) {
      if (Math.abs(position - p) < d) return p;
    }
    for (const s of snapPointsRef.current.scrubbers) {
      if (s.id === excludeId) continue;
      if (Math.abs(position - s.left) < d) return s.left;
      if (Math.abs(position - s.right) < d) return s.right;
    }
    return position;
  }, []); // stable — reads everything via refs

  // Apply transform directly to the DOM element (bypasses React render pipeline).
  const applyTransform = useCallback((left: number, track: number, width?: number) => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${left}px, ${track * DEFAULT_TRACK_HEIGHT + 2}px, 0)`;
    if (width !== undefined) el.style.width = `${width}px`;
  }, []);

  // Stable mousemove handler — added/removed only at drag start/end.
  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const { scrubber: s, containerRef, expandTimeline, timelineWidth, trackCount } = propsRef.current;

    if (d.mode === "drag") {
      let rawLeft = e.clientX - d.startClientX + d.startLeft;
      rawLeft = Math.max(0, Math.min(timelineWidth - s.width, rawLeft));

      const snapped = findSnap(rawLeft, s.id);
      d.snappedEdge = snapped !== rawLeft ? "left" : null;
      d.currentLeft = snapped;

      // Track change from mouse Y relative to the scroll container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const relY = e.clientY - rect.top + containerRef.current.scrollTop;
        d.currentTrack = Math.max(0, Math.min(trackCount - 1, Math.floor(relY / DEFAULT_TRACK_HEIGHT)));
      }

      applyTransform(d.currentLeft, d.currentTrack);

      // Edge auto-scroll
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const threshold = 80;
        const speed = 12;
        if (e.clientX < rect.left + threshold) containerRef.current.scrollLeft -= speed;
        else if (e.clientX > rect.right - threshold) {
          containerRef.current.scrollLeft += speed;
          expandTimeline();
        }
      }
    } else if (d.mode === "resize-left") {
      const delta = e.clientX - d.startClientX;
      let newLeft = d.startLeft + delta;
      let newWidth = d.startWidth - delta;

      newLeft = Math.max(0, newLeft);
      newWidth = Math.max(MINIMUM_WIDTH, newWidth);

      const snapped = findSnap(newLeft, s.id);
      d.snappedEdge = snapped !== newLeft ? "left" : null;
      newLeft = snapped;
      newWidth = d.startLeft + d.startWidth - newLeft;
      if (newLeft + newWidth > timelineWidth) newWidth = timelineWidth - newLeft;

      d.currentLeft = newLeft;
      d.currentWidth = newWidth;
      applyTransform(d.currentLeft, d.startTrack, d.currentWidth);
    } else if (d.mode === "resize-right") {
      d.altHeld = e.altKey;
      const delta = e.clientX - d.startClientX;
      let newWidth = Math.max(MINIMUM_WIDTH, d.startWidth + delta);

      const rightEdge = d.startLeft + newWidth;
      const snappedRight = findSnap(rightEdge, s.id);
      d.snappedEdge = snappedRight !== rightEdge ? "right" : null;
      newWidth = snappedRight - d.startLeft;

      if (d.startLeft + newWidth > timelineWidth) {
        if (expandTimeline()) {
          newWidth = Math.max(MINIMUM_WIDTH, d.startWidth + delta);
        } else {
          newWidth = timelineWidth - d.startLeft;
        }
      }

      d.currentWidth = newWidth;
      applyTransform(d.startLeft, d.startTrack, d.currentWidth);
    }
  }, [findSnap, applyTransform]); // stable

  // Stable mouseup handler.
  const handleDocumentMouseUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;

    document.removeEventListener("mousemove", handleDocumentMouseMove);
    document.removeEventListener("mouseup", handleDocumentMouseUp);

    const { scrubber: s, onUpdate, onRippleEdit } = propsRef.current;

    // Ripple: Alt + right-resize
    if (d.mode === "resize-right" && d.altHeld && onRippleEdit) {
      const delta = d.startLeft + d.currentWidth - d.rippleOriginalRight;
      if (delta !== 0) onRippleEdit(s.id, d.rippleOriginalRight, delta);
    }

    // Single React state commit — only here, never mid-drag.
    onUpdate({ ...s, left: d.currentLeft, width: d.currentWidth, y: d.currentTrack });

    setIsDragging(false);
    setIsResizing(false);

    if (elRef.current) elRef.current.style.willChange = "auto";
  }, [handleDocumentMouseMove]); // stable

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "drag" | "resize-left" | "resize-right") => {
      e.preventDefault();
      e.stopPropagation();

      const { scrubber: s, onSelect, onBeginTransform } = propsRef.current;
      onSelect(s.id, e.ctrlKey || e.metaKey);

      if (
        (mode === "resize-left" || mode === "resize-right") &&
        (s.mediaType === "video" || s.mediaType === "audio")
      ) return;

      dragRef.current = {
        active: true,
        mode,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startLeft: s.left,
        startWidth: s.width,
        startTrack: s.y ?? 0,
        currentLeft: s.left,
        currentWidth: s.width,
        currentTrack: s.y ?? 0,
        altHeld: false,
        rippleOriginalRight: s.left + s.width,
        snappedEdge: null,
      };

      if (mode === "drag") setIsDragging(true);
      else setIsResizing(true);

      if (elRef.current) elRef.current.style.willChange = "transform";

      document.addEventListener("mousemove", handleDocumentMouseMove);
      document.addEventListener("mouseup", handleDocumentMouseUp);

      onBeginTransform?.();
    },
    [handleDocumentMouseMove, handleDocumentMouseUp],
  ); // stable

  // Delete key handler
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.isContentEditable
      ) return;
      e.preventDefault();
      onDelete?.(scrubber.id);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSelected, onDelete, scrubber.id]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false, x: 0, y: 0,
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(scrubber.id, e.ctrlKey);
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    },
    [onSelect, scrubber.id],
  );

  useEffect(() => {
    if (!contextMenu.visible) return;
    const close = () => setContextMenu({ visible: false, x: 0, y: 0 });
    document.addEventListener("click", close);
    document.addEventListener("contextmenu", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("contextmenu", close);
    };
  }, [contextMenu.visible]);

  const waveformUrl =
    scrubber.mediaType === "audio" ? (scrubber.mediaUrlRemote ?? scrubber.mediaUrlLocal) : null;
  const waveformPeaks = useWaveform(waveformUrl);
  const scrubberH = DEFAULT_TRACK_HEIGHT - 4;

  const getScrubberColor = () => {
    const base: Record<string, string> = {
      video: "bg-primary border-primary/60 text-primary-foreground",
      image: "bg-green-600 border-green-500 text-white",
      text: "bg-purple-600 border-purple-500 text-white",
      audio: "bg-blue-600 border-blue-400 text-white",
      groupped_scrubber: "bg-gray-600 border-gray-400 text-white",
    };
    const selected: Record<string, string> = {
      video: "bg-primary border-primary text-primary-foreground ring-2 ring-primary/50",
      image: "bg-green-600 border-green-400 text-white ring-2 ring-green-400/50",
      text: "bg-purple-600 border-purple-400 text-white ring-2 ring-purple-400/50",
      audio: "bg-blue-600 border-blue-400 text-white ring-2 ring-blue-400/50",
      groupped_scrubber: "bg-gray-600 border-gray-400 text-white ring-2 ring-gray-400/50",
    };
    const set = isSelected ? selected : base;
    return set[scrubber.mediaType] ?? set.video;
  };

  const isResizable =
    scrubber.mediaType !== "video" &&
    scrubber.mediaType !== "audio" &&
    scrubber.mediaType !== "groupped_scrubber";

  return (
    <>
      <div
        ref={elRef}
        data-scrubber
        className={`group absolute rounded-sm border shadow-sm hover:shadow-md transition-shadow select-none ${getScrubberColor()} ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          top: 0,
          left: 0,
          width: scrubber.width,
          height: DEFAULT_TRACK_HEIGHT - 4,
          minWidth: MINIMUM_WIDTH,
          transform: `translate3d(${scrubber.left}px, ${(scrubber.y || 0) * DEFAULT_TRACK_HEIGHT + 2}px, 0)`,
          zIndex: isDragging || isResizing ? 1000 : isSelected ? 20 : 15,
        }}
        onMouseDown={(e) => handleMouseDown(e, "drag")}
        onContextMenu={handleContextMenu}>

        {/* Waveform */}
        {waveformPeaks && (
          <WaveformCanvas peaks={waveformPeaks} width={scrubber.width} height={scrubberH} color="rgba(255,255,255,0.5)" />
        )}

        {/* Media type badge */}
        <div className="absolute top-0.5 left-3 text-xs font-medium opacity-80 pointer-events-none">
          {scrubber.mediaType === "video" && "V"}
          {scrubber.mediaType === "image" && "I"}
          {scrubber.mediaType === "text" && "T"}
          {scrubber.mediaType === "audio" && "A"}
          {scrubber.mediaType === "groupped_scrubber" && "G"}
        </div>

        {/* Name */}
        <div className="absolute top-0.5 left-6 right-6 text-xs truncate opacity-90 pointer-events-none">
          {scrubber.name}
        </div>

        {/* Status badges */}
        <div className="absolute bottom-0.5 right-6 flex items-center gap-0.5 pointer-events-none">
          {scrubber.muted && (
            <div className="text-[9px] font-bold opacity-80 bg-black/30 rounded px-0.5">M</div>
          )}
          {scrubber.playbackRate !== undefined && scrubber.playbackRate !== 1 && (
            <div className="text-[9px] font-bold opacity-80 bg-black/30 rounded px-0.5">
              {scrubber.playbackRate}x
            </div>
          )}
        </div>

        {/* Keyframe lane toggle */}
        {onToggleKeyframeLanes && (
          <button
            className="absolute bottom-0.5 right-0.5 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity z-20"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleKeyframeLanes(scrubber.id); }}
            title="Toggle keyframe lanes">
            {scrubber.keyframeLanesExpanded ? (
              <ChevronDown className="h-2.5 w-2.5" />
            ) : (
              <ChevronRight className="h-2.5 w-2.5" />
            )}
          </button>
        )}

        {/* Resize handles */}
        {isResizable && (
          <>
            <div
              className="absolute top-0 left-0 h-full w-2 cursor-ew-resize z-20 hover:bg-white/30 transition-colors border-r border-white/20 group-hover:bg-white/10"
              onMouseDown={(e) => handleMouseDown(e, "resize-left")}
            />
            <div
              className="absolute top-0 right-0 h-full w-2 cursor-ew-resize z-20 hover:bg-white/30 transition-colors border-l border-white/20 group-hover:bg-white/10"
              onMouseDown={(e) => handleMouseDown(e, "resize-right")}
            />
          </>
        )}

        {/* Selection ring */}
        {isSelected && (
          <div className="absolute -inset-0.5 rounded-sm pointer-events-none shadow-md shadow-primary/30 ring-1 ring-primary/60" />
        )}
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-popover text-popover-foreground border border-border rounded-md shadow-lg py-1 z-[9999]"
          style={{ left: contextMenu.x, top: contextMenu.y }}>

          {selectedScrubberIds.length > 1 && scrubber.mediaType !== "groupped_scrubber" && (
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              onClick={() => { onGroupScrubbers(); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
              <Group className="h-3 w-3" />
              Group Selected
            </button>
          )}

          {scrubber.mediaType === "groupped_scrubber" && (
            <>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                onClick={() => { onUngroupScrubber(scrubber.id); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
                <Ungroup className="h-3 w-3" />
                Ungroup
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                onClick={() => { onMoveToMediaBin?.(scrubber.id); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
                <Archive className="h-3 w-3" />
                Move to Media Bin
              </button>
            </>
          )}

          {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Volume</span>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onUpdate({ ...scrubber, muted: !scrubber.muted })}>
                  {scrubber.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </button>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={scrubber.muted ? 0 : (scrubber.volume ?? 1)}
                onChange={(e) => onUpdate({ ...scrubber, volume: parseFloat(e.target.value), muted: false })}
                className="w-full h-1 accent-primary cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="text-[10px] text-muted-foreground text-right mt-0.5">
                {scrubber.muted ? "muted" : `${Math.round((scrubber.volume ?? 1) * 100)}%`}
              </div>
            </div>
          )}

          {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
            <div className="relative">
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                onMouseEnter={() => setShowSpeedMenu(true)}
                onMouseLeave={() => setShowSpeedMenu(false)}
                onClick={() => setShowSpeedMenu((v) => !v)}>
                <span>Speed</span>
                <span className="text-muted-foreground">{scrubber.playbackRate ?? 1}x ›</span>
              </button>
              {showSpeedMenu && (
                <div
                  className="absolute left-full top-0 bg-popover border border-border rounded-md shadow-lg py-1 z-[10000]"
                  onMouseEnter={() => setShowSpeedMenu(true)}
                  onMouseLeave={() => setShowSpeedMenu(false)}>
                  {[0.25, 0.5, 1, 1.5, 2, 4].map((rate) => (
                    <button
                      key={rate}
                      className={`flex items-center w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left ${
                        (scrubber.playbackRate ?? 1) === rate ? "text-primary font-semibold" : ""
                      }`}
                      onClick={() => {
                        onUpdate({ ...scrubber, playbackRate: rate });
                        setContextMenu({ visible: false, x: 0, y: 0 });
                        setShowSpeedMenu(false);
                      }}>
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => {
              onDelete?.(scrubber.id);
              setContextMenu({ visible: false, x: 0, y: 0 });
            }}>
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </>
  );
};
