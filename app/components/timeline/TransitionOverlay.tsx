import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type Transition, type ScrubberState, DEFAULT_TRACK_HEIGHT } from "./types";

interface TransitionOverlayProps {
  transition: Transition;
  leftScrubber: ScrubberState | null;
  rightScrubber: ScrubberState | null;
  pixelsPerSecond: number;
  onDelete: (transitionId: string) => void;
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  transition,
  leftScrubber,
  rightScrubber,
  pixelsPerSecond,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  // console.log("transition hovered", isHovered);


  // Calculate position and size for overlap area
  const getTransitionStyle = () => {
    let left = 0;
    const width = (transition.durationInFrames / 30) * pixelsPerSecond; // Convert frames to pixels
    let top = 0;
    
    // Define snap distance threshold (same as in useTimeline.ts)
    const SNAP_DISTANCE = 10;

    if (leftScrubber && rightScrubber) {
      // Check if there's an overlap or a gap between scrubbers
      const leftScrubberEnd = leftScrubber.left + leftScrubber.width;
      const gap = rightScrubber.left - leftScrubberEnd;
      
      if (gap <= SNAP_DISTANCE) {
        // Scrubbers are close enough - position transition on the overlap area
        // The overlap starts at the rightScrubber.left and has width equal to transition duration
        const overlapStart = rightScrubber.left;
        left = overlapStart;
        top = leftScrubber.y * DEFAULT_TRACK_HEIGHT;
      } else {
        // There's a gap - position the transition as an outro from the left scrubber
        left = leftScrubber.left + leftScrubber.width - width;
        top = leftScrubber.y * DEFAULT_TRACK_HEIGHT;
      }
    } else if (leftScrubber) {
      // Transition after a scrubber (outro) - position at the end of left scrubber
      left = leftScrubber.left + leftScrubber.width - width;
      top = leftScrubber.y * DEFAULT_TRACK_HEIGHT;
    } else if (rightScrubber) {
      // Transition before a scrubber (intro) - position at the start of right scrubber
      left = rightScrubber.left;
      top = rightScrubber.y * DEFAULT_TRACK_HEIGHT;
    }

    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top + 10}px`, // Small offset from top
      width: `${width}px`,
      height: `${DEFAULT_TRACK_HEIGHT - 20}px`, // Smaller than track height
      zIndex: 50,
    };
  };

  const renderTransitionIcon = () => {
    const baseClasses = "absolute rounded-sm opacity-70";

    switch (transition.presentation) {
      case "fade":
        return (
          <div className="relative w-full h-full bg-gradient-to-r from-blue-500/50 to-blue-300/50 rounded-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        );
      case "slide":
        return (
          <div className="relative w-full h-full bg-gradient-to-r from-pink-500/50 to-pink-300/50 rounded-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12" />
          </div>
        );
      case "wipe":
        return (
          <div className="relative w-full h-full bg-gradient-to-r from-green-500/50 to-green-300/50 rounded-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        );
      case "flip":
        return (
          <div className="relative w-full h-full bg-gradient-to-r from-purple-500/50 to-purple-300/50 rounded-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-3" />
          </div>
        );
      case "clockWipe":
        return (
          <div className="relative w-full h-full bg-gradient-to-r from-orange-500/50 to-orange-300/50 rounded-sm">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{ clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 75% 100%)" }}
            />
          </div>
        );
      case "iris":
        return (
          <div className="relative w-full h-full bg-gradient-to-r from-teal-500/50 to-teal-300/50 rounded-sm">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{ clipPath: "circle(30% at 50% 50%)" }}
            />
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gradient-to-r from-gray-500/50 to-gray-300/50 rounded-sm" />
        );
    }
  };

  return (
    <div
      style={getTransitionStyle()}
      className="border border-border/50 rounded-sm cursor-pointer transition-all hover:border-border hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Transition visual effect */}
      {renderTransitionIcon()}

      {/* Delete button - shown on hover */}
      {isHovered && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transition.id);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      {/* Transition label */}
      <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/50 text-white text-xs rounded-b-sm truncate">
        {transition.presentation}
      </div>
    </div>
  );
}; 