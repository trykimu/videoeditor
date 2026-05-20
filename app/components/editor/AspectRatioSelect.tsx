import React from "react";
import {
  ASPECT_RATIO_PRESETS,
  findAspectPreset,
  type AspectRatioPresetId,
} from "~/lib/aspect-ratios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AspectRatioIcon } from "./AspectRatioIcon";
import { cn } from "~/lib/utils";

interface AspectRatioSelectProps {
  width: number;
  height: number;
  disabled?: boolean;
  onSelectPreset: (presetId: AspectRatioPresetId) => void;
}

export function AspectRatioSelect({ width, height, disabled, onSelectPreset }: AspectRatioSelectProps) {
  const activeId = findAspectPreset(width, height);

  return (
    <Select
      value={activeId}
      onValueChange={(id) => {
        if (id !== "custom") onSelectPreset(id as AspectRatioPresetId);
      }}
      disabled={disabled}>
      <SelectTrigger
        size="sm"
        className="h-7 min-w-[108px] gap-2 border-0 bg-muted/50 px-2 text-xs shadow-none">
        <AspectRatioIcon id={activeId} className="shrink-0" active={activeId !== "custom"} />
        <SelectValue>{activeId === "custom" ? "Custom" : activeId}</SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[200px]">
        {ASPECT_RATIO_PRESETS.map((p) => (
          <SelectItem key={p.id} value={p.id} className="py-2 pl-2 pr-3">
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-10 items-center justify-center rounded-md border border-border/60 bg-muted/40",
                  activeId === p.id && "border-primary/40 bg-primary/10",
                )}>
                <AspectRatioIcon id={p.id} active={activeId === p.id} />
              </span>
              <span className="flex flex-col gap-0.5 leading-none">
                <span className="text-xs font-medium">{p.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {p.width} × {p.height}
                </span>
              </span>
            </span>
          </SelectItem>
        ))}
        <SelectItem value="custom" className="py-2 pl-2 pr-3">
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-8 w-10 items-center justify-center rounded-md border border-border/60 bg-muted/40",
                activeId === "custom" && "border-primary/40 bg-primary/10",
              )}>
              <AspectRatioIcon id="custom" active={activeId === "custom"} />
            </span>
            <span className="flex flex-col gap-0.5 leading-none">
              <span className="text-xs font-medium">Custom</span>
              <span className="text-[10px] text-muted-foreground">Set W × H manually</span>
            </span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
