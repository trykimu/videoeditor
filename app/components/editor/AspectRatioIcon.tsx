import React from "react";
import type { AspectRatioPresetId } from "~/lib/aspect-ratios";
import { cn } from "~/lib/utils";

const ICON_CLASS = "stroke-current fill-none stroke-[1.75]";

export function AspectRatioIcon({
  id,
  className,
  active,
}: {
  id: AspectRatioPresetId | "custom";
  className?: string;
  active?: boolean;
}) {
  const stroke = active ? "stroke-primary" : "stroke-muted-foreground";
  const box = cn(ICON_CLASS, stroke, className);

  if (id === "16:9" || id === "21:9" || id === "4:3") {
    const w = id === "21:9" ? 18 : 16;
    return (
      <svg width={w} height={10} viewBox={`0 0 ${w} 10`} className={box} aria-hidden>
        <rect x="1" y="1" width={w - 2} height="8" rx="1.5" />
      </svg>
    );
  }
  if (id === "9:16" || id === "4:5") {
    const h = id === "4:5" ? 14 : 16;
    return (
      <svg width={10} height={h} viewBox={`0 0 10 ${h}`} className={box} aria-hidden>
        <rect x="1" y="1" width="8" height={h - 2} rx="1.5" />
      </svg>
    );
  }
  if (id === "1:1") {
    return (
      <svg width={12} height={12} viewBox="0 0 12 12" className={box} aria-hidden>
        <rect x="1" y="1" width="10" height="10" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" className={box} aria-hidden>
      <rect x="1" y="1" width="8" height="8" rx="1" />
      <path d="M9.5 11.5h4M11.5 9.5v4" strokeLinecap="round" />
    </svg>
  );
}
