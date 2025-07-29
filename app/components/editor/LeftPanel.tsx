import React from "react";
import { Link, Outlet, useLocation } from "react-router";
import { FileImage, Type, BetweenVerticalEnd } from "lucide-react";
import { type MediaBinItem } from "~/components/timeline/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface LeftPanelProps {
  mediaBinItems: MediaBinItem[];
  onAddMedia: (file: File) => void;
  onAddText: (
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold"
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
}

export default function LeftPanel({
  mediaBinItems,
  onAddMedia,
  onAddText,
  contextMenu,
  handleContextMenu,
  handleDeleteFromContext,
  handleSplitAudioFromContext,
  handleCloseContextMenu,
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
        <div className="border-b border-border bg-muted/30">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-transparent p-0">
            <TabsTrigger
              value="media-bin"
              asChild
              className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Link to="/media-bin" className="flex items-center gap-1.5">
                <FileImage className="h-3 w-3" />
              </Link>
            </TabsTrigger>
            <TabsTrigger
              value="text-editor"
              asChild
              className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Link to="/text-editor" className="flex items-center gap-1.5">
                <Type className="h-3 w-3" />
              </Link>
            </TabsTrigger>
            <TabsTrigger
              value="transitions"
              asChild
              className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Link to="/transitions" className="flex items-center gap-1.5">
                <BetweenVerticalEnd className="h-3 w-3" />
              </Link>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <Outlet
            context={{
              // MediaBin props
              mediaBinItems,
              onAddMedia,
              onAddText,
              contextMenu,
              handleContextMenu,
              handleDeleteFromContext,
              handleSplitAudioFromContext,
              handleCloseContextMenu,
            }}
          />
        </div>
      </Tabs>
    </div>
  );
}
