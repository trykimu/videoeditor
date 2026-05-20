import React from "react";
import { type MediaBinItem } from "~/components/timeline/types";
import MediaBin from "~/components/timeline/MediaBin";
import TextEditor from "~/components/media/TextEditor";
import Transitions from "~/components/media/Transitions";

export type LeftPanelSection = "media-bin" | "text-editor" | "transitions";

interface LeftPanelProps {
  section: LeftPanelSection;
  mediaBinItems: MediaBinItem[];
  isMediaLoading?: boolean;
  onAddMedia: (file: File) => void;
  onAddText: (
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold",
  ) => void;
  contextMenu: {
    x: number;
    y: number;
    item: MediaBinItem;
  } | null;
  handleContextMenu: (e: React.MouseEvent, item: MediaBinItem) => void;
  handleDeleteFromContext: () => void;
  handleSplitAudioFromContext: () => void;
  handleCloseContextMenu: () => void;
  arrangeMode?: "default" | "group";
  sortBy?: "default" | "name_asc" | "name_desc";
  onArrangeModeChange?: (mode: "default" | "group") => void;
  onSortByChange?: (sort: "default" | "name_asc" | "name_desc") => void;
  onAfterAddText?: () => void;
}

export default function LeftPanel({
  section,
  mediaBinItems,
  isMediaLoading,
  onAddMedia,
  onAddText,
  contextMenu,
  handleContextMenu,
  handleDeleteFromContext,
  handleSplitAudioFromContext,
  handleCloseContextMenu,
  arrangeMode,
  sortBy,
  onArrangeModeChange,
  onSortByChange,
  onAfterAddText,
}: LeftPanelProps) {
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden p-2">
        {section === "media-bin" && (
          <MediaBin
            mediaBinItems={mediaBinItems}
            isMediaLoading={isMediaLoading}
            onAddMedia={onAddMedia}
            onAddText={onAddText}
            contextMenu={contextMenu}
            handleContextMenu={handleContextMenu}
            handleDeleteFromContext={handleDeleteFromContext}
            handleSplitAudioFromContext={handleSplitAudioFromContext}
            handleCloseContextMenu={handleCloseContextMenu}
            arrangeModeExternal={arrangeMode}
            sortByExternal={sortBy}
            onArrangeModeChange={onArrangeModeChange}
            onSortByChange={onSortByChange}
          />
        )}
        {section === "text-editor" && <TextEditor onAddText={onAddText} onAfterAdd={onAfterAddText} />}
        {section === "transitions" && <Transitions />}
      </div>
    </div>
  );
}
