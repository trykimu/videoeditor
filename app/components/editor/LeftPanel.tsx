import React from "react";
import { Link, Outlet, useLocation } from "react-router";
import { FileImage, Type, BetweenVerticalEnd } from "lucide-react";
import { type MediaBinItem } from "~/components/timeline/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface LeftPanelProps {
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
  // When true, renders the horizontal tab headers (default). Set false to hide headers
  showTabs?: boolean;
  // Persisted MediaBin view state
  arrangeMode?: "default" | "group";
  sortBy?: "default" | "name_asc" | "name_desc";
  onArrangeModeChange?: (mode: "default" | "group") => void;
  onSortByChange?: (sort: "default" | "name_asc" | "name_desc") => void;
}

export default function LeftPanel({
  mediaBinItems,
  isMediaLoading,
  onAddMedia,
  onAddText,
  contextMenu,
  handleContextMenu,
  handleDeleteFromContext,
  handleSplitAudioFromContext,
  handleCloseContextMenu,
  showTabs = true,
  arrangeMode,
  sortBy,
  onArrangeModeChange,
  onSortByChange,
}: LeftPanelProps) {
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes("/media-bin")) return "media-bin";
    if (location.pathname.includes("/text-editor")) return "text-editor";
    if (location.pathname.includes("/transitions")) return "transitions";
    return "media-bin"; // default
  };

  const activeTab = getActiveTab();

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} className="h-full flex flex-col">
        {/* Tab Headers */}
        {showTabs && (
          <div className="border-b border-border bg-muted/30">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-transparent p-0">
              <TabsTrigger
                value="media-bin"
                asChild
                className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Link to="media-bin" className="flex items-center gap-1.5">
                  <FileImage className="h-3 w-3" />
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="text-editor"
                asChild
                className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Link to="text-editor" className="flex items-center gap-1.5">
                  <Type className="h-3 w-3" />
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="transitions"
                asChild
                className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Link to="transitions" className="flex items-center gap-1.5">
                  <BetweenVerticalEnd className="h-3 w-3" />
                </Link>
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-2">
          <Outlet
            context={{
              // MediaBin props
              mediaBinItems,
              isMediaLoading,
              onAddMedia,
              onAddText,
              contextMenu,
              handleContextMenu,
              handleDeleteFromContext,
              handleSplitAudioFromContext,
              handleCloseContextMenu,
              arrangeModeExternal: arrangeMode,
              sortByExternal: sortBy,
              onArrangeModeChange,
              onSortByChange,
            }}
          />
        </div>
      </Tabs>
    </div>
  );
}
