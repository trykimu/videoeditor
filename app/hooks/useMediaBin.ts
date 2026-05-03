import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { type MediaBinItem, type ScrubberState } from "~/components/timeline/types";
import { generateUUID } from "~/utils/uuid";

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function inferMediaTypeFromMime(mimeType: string): "video" | "image" | "audio" | null {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

type RendererAsset = {
  id: string;
  filename: string;
  mediaType: "video" | "image" | "audio" | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationInSeconds: number | null;
  assetUrl: string;
};

// Delete asset from R2 + DB via asset ID
export const deleteMediaFile = async (
  assetId: string,
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`/renderer/assets/${assetId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete asset");
    }
    return await response.json();
  } catch (error) {
    console.error("Delete API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// Clone asset in R2 + DB via asset ID
export const cloneMediaFile = async (
  assetId: string,
  suffix: string,
): Promise<{
  success: boolean;
  asset?: { id: string; assetUrl: string; [key: string]: unknown };
  error?: string;
}> => {
  try {
    const response = await fetch(`/renderer/assets/${assetId}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ suffix }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to clone asset");
    }
    return { success: true, ...(await response.json()) };
  } catch (error) {
    console.error("Clone API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// Helper function to get media metadata
const getMediaMetadata = (
  file: File,
  mediaType: "video" | "image" | "audio",
): Promise<{
  durationInSeconds?: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    if (mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const durationInSeconds = video.duration;

        URL.revokeObjectURL(url);
        resolve({
          durationInSeconds: isFinite(durationInSeconds) ? durationInSeconds : undefined,
          width,
          height,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video metadata"));
      };

      video.src = url;
    } else if (mediaType === "image") {
      const img = new Image();

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        URL.revokeObjectURL(url);
        resolve({
          durationInSeconds: undefined, // Images don't have duration
          width,
          height,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image metadata"));
      };

      img.src = url;
    } else if (mediaType === "audio") {
      const audio = document.createElement("audio");
      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        const durationInSeconds = audio.duration;

        URL.revokeObjectURL(url);
        resolve({
          durationInSeconds: isFinite(durationInSeconds) ? durationInSeconds : undefined,
          width: 0, // Audio files don't have visual dimensions
          height: 0,
        });
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load audio metadata"));
      };

      audio.src = url;
    }
  });
};

export const useMediaBin = (handleDeleteScrubbersByMediaBinId: (mediaBinId: string) => void) => {
  const [mediaBinItems, setMediaBinItems] = useState<MediaBinItem[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
  const projectId = (() => {
    try {
      const m = window.location.pathname.match(/\/project\/([^/]+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  })();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: MediaBinItem;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      try {
        const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
        const res = await fetch(`/renderer/assets${query}`, { credentials: "include" });
        if (!res.ok) return;

        const payload = (await res.json()) as { assets?: RendererAsset[] };
        const assets = Array.isArray(payload.assets) ? payload.assets : [];

        const loadedItems: MediaBinItem[] = assets.flatMap((asset) => {
          const mediaType = asset.mediaType ?? inferMediaTypeFromMime(asset.mimeType);
          if (!mediaType) return [];

          return [
            {
              id: asset.id,
              name: asset.filename,
              mediaType,
              mediaUrlLocal: null,
              mediaUrlRemote: asset.assetUrl,
              durationInSeconds: asset.durationInSeconds ?? 0,
              media_width: asset.width ?? 0,
              media_height: asset.height ?? 0,
              text: null,
              isUploading: false,
              uploadProgress: null,
              left_transition_id: null,
              right_transition_id: null,
              groupped_scrubbers: null,
            },
          ];
        });

        if (!cancelled) {
          setMediaBinItems((prev) => {
            const loadedIds = new Set(loadedItems.map((item) => item.id));
            const preservedItems = prev.filter(
              (item) =>
                item.mediaType === "text" ||
                item.mediaType === "groupped_scrubber" ||
                item.isUploading ||
                !loadedIds.has(item.id),
            );
            return [...loadedItems, ...preservedItems];
          });
        }
      } catch (error) {
        console.error("Failed to load media bin assets:", error);
      } finally {
        if (!cancelled) setIsMediaLoading(false);
      }
    };

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleAddMediaToBin = useCallback(async (file: File) => {
    const id = generateUUID();
    const name = file.name;
    let mediaType: "video" | "image" | "audio";
    if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("audio/")) mediaType = "audio";
    else {
      toast.error("Unsupported file type. Please select a video, image, or audio file.");
      return;
    }

    try {
      const mediaUrlLocal = URL.createObjectURL(file);
      const metadata = await getMediaMetadata(file, mediaType);

      // Add item to media bin immediately with upload progress tracking
      const newItem: MediaBinItem = {
        id,
        name,
        mediaType,
        mediaUrlLocal,
        mediaUrlRemote: null, // Will be set after successful upload
        durationInSeconds: metadata.durationInSeconds ?? 0,
        media_width: metadata.width,
        media_height: metadata.height,
        text: null,
        isUploading: true,
        uploadProgress: 0,
        left_transition_id: null,
        right_transition_id: null,
        groupped_scrubbers: null,
      };
      setMediaBinItems((prev) => [...prev, newItem]);

      // Step 1: Hash file content for deduplication (WebCrypto SHA-256)
      const contentHash = await hashFile(file);

      // Step 2: Initiate upload — server checks dedup and returns either
      //   { alreadyExists: true, assetUrl }  ← file already in R2, skip upload
      //   { assetUrl }                        ← new file, proceed with upload
      const initiateRes = await fetch("/renderer/assets/initiate-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assetId: id,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
          mediaType,
          contentHash,
          projectId,
        }),
      });
      if (!initiateRes.ok) throw new Error("Failed to initiate upload");
      const initiateResult = await initiateRes.json() as {
        alreadyExists?: boolean;
        assetUrl: string;
      };

      if (!initiateResult.alreadyExists) {
        // Step 3: Upload raw bytes to renderer (same-origin) to avoid browser↔R2 CORS
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", `/renderer/assets/upload/${id}`);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setMediaBinItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, uploadProgress: pct } : item)),
              );
            }
          };
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Network error during R2 upload"));
          xhr.send(file);
        });

        // Step 4: Confirm upload — persist media dimensions/duration to DB
        const completeRes = await fetch("/renderer/assets/complete-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            assetId: id,
            width: metadata.width,
            height: metadata.height,
            durationInSeconds: metadata.durationInSeconds,
          }),
        });
        if (!completeRes.ok) throw new Error("Failed to complete upload");
      }

      // Step 5: Store authenticated asset URL and mark upload done
      setMediaBinItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, mediaUrlRemote: initiateResult.assetUrl, isUploading: false, uploadProgress: null }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error adding media to bin:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Remove the failed item from media bin
      setMediaBinItems((prev) => prev.filter((item) => item.id !== id));

      throw new Error(`Failed to add media: ${errorMessage}`);
    }
  }, [projectId]);

  const handleAddTextToBin = useCallback(
    (
      textContent: string,
      fontSize: number,
      fontFamily: string,
      color: string,
      textAlign: "left" | "center" | "right",
      fontWeight: "normal" | "bold",
    ) => {
      const newItem: MediaBinItem = {
        id: generateUUID(),
        name: textContent,
        mediaType: "text",
        media_width: 0,
        media_height: 0,
        text: {
          textContent,
          fontSize,
          fontFamily,
          color,
          textAlign,
          fontWeight,
          template: null, // for now, maybe we can also allow text to have a template (same ones from captions)
        },
        mediaUrlLocal: null,
        mediaUrlRemote: null,
        durationInSeconds: 0, // interesting code. i wish i remembered why i did this. maybe there's a better way.
        isUploading: false,
        uploadProgress: null,
        left_transition_id: null,
        right_transition_id: null,
        groupped_scrubbers: null,
      };
      setMediaBinItems((prev) => [...prev, newItem]);
    },
    [],
  );

  const getMediaBinItems = useCallback(() => mediaBinItems, [mediaBinItems]);

  const setTextItems = useCallback((textItems: MediaBinItem[]) => {
    setMediaBinItems((prev) => {
      const withoutText = prev.filter((i) => i.mediaType !== "text");
      return [
        ...withoutText,
        ...textItems.map(
          (t): MediaBinItem => ({
            ...t,
            mediaType: "text" as const,
            mediaUrlLocal: null,
            mediaUrlRemote: null,
            isUploading: false,
            uploadProgress: null,
          }),
        ),
      ];
    });
  }, []);

  const handleDeleteMedia = useCallback(
    async (item: MediaBinItem) => {
      try {
        if (item.mediaType === "text" || item.mediaType === "groupped_scrubber") {
          setMediaBinItems((prev) => prev.filter((binItem) => binItem.id !== item.id));

          // Also remove any scrubbers from the timeline that use this media
          if (handleDeleteScrubbersByMediaBinId) {
            handleDeleteScrubbersByMediaBinId(item.id);
          }

          if (!item.mediaUrlRemote) {
            console.error("No remote URL found for media item");
            return;
          }
        }
        // Call authenticated delete by asset id
        const assetId = item.id;
        const res = await fetch(`/renderer/assets/${assetId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          console.log(`Media deleted: ${item.name}`);
          // Remove from media bin state
          setMediaBinItems((prev) => prev.filter((binItem) => binItem.id !== item.id));
          // Also remove any scrubbers from the timeline that use this media
          if (handleDeleteScrubbersByMediaBinId) {
            handleDeleteScrubbersByMediaBinId(item.id);
          }
        } else {
          console.error("Failed to delete media:", await res.text());
        }
      } catch (error) {
        console.error("Error deleting media:", error);
      }
    },
    [handleDeleteScrubbersByMediaBinId],
  );

  const handleSplitAudio = useCallback(async (videoItem: MediaBinItem) => {
    if (videoItem.mediaType !== "video") {
      throw new Error("Can only split audio from video files");
    }

    try {
      // Clone via authenticated API (server copies in R2 and records in DB)
      const cloneResult = await cloneMediaFile(videoItem.id, "(Audio)");
      if (!cloneResult.success || !cloneResult.asset) throw new Error("Failed to clone media file");

      // Create a new audio media item using the returned authenticated URL
      const audioItem: MediaBinItem = {
        id: cloneResult.asset.id,
        name: `${videoItem.name} (Audio)`,
        mediaType: "audio",
        mediaUrlLocal: videoItem.mediaUrlLocal, // Reuse the original video's blob URL for preview
        mediaUrlRemote: cloneResult.asset.assetUrl,
        durationInSeconds: videoItem.durationInSeconds,
        media_width: 0, // Audio doesn't have visual dimensions
        media_height: 0,
        text: null,
        isUploading: false,
        uploadProgress: null,
        left_transition_id: null,
        right_transition_id: null,
        groupped_scrubbers: null,
      };

      // Add the audio item to the media bin
      setMediaBinItems((prev) => [...prev, audioItem]);
      setContextMenu(null); // Close context menu after action

      console.log(`Audio split successful: ${videoItem.name} -> ${audioItem.name}`);
    } catch (error) {
      console.error("Error splitting audio:", error);
      throw error;
    }
  }, []);

  // Handle right-click to show context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, item: MediaBinItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  }, []);

  // Handle context menu actions
  const handleDeleteFromContext = useCallback(async () => {
    if (!contextMenu) return;
    await handleDeleteMedia(contextMenu.item);
    setContextMenu(null);
  }, [contextMenu, handleDeleteMedia]);

  const handleSplitAudioFromContext = useCallback(async () => {
    if (!contextMenu) return;
    await handleSplitAudio(contextMenu.item);
  }, [contextMenu, handleSplitAudio]);

  // Close context menu when clicking outside
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleAddGroupToMediaBin = useCallback((groupedScrubber: ScrubberState, currentPixelsPerSecond: number) => {
    // Calculate the actual duration in seconds by dividing the current pixel width
    // by the current zoom-adjusted pixels per second - this gives us the true duration
    // regardless of zoom level
    const actualDurationInSeconds = groupedScrubber.width / currentPixelsPerSecond;

    // Create a new media bin item from the grouped scrubber
    const newItem: MediaBinItem = {
      id: groupedScrubber.id,
      name: groupedScrubber.name || "Grouped Media",
      mediaType: "groupped_scrubber",
      mediaUrlLocal: null,
      mediaUrlRemote: null,
      durationInSeconds: actualDurationInSeconds,
      media_width: groupedScrubber.media_width || 0,
      media_height: groupedScrubber.media_height || 0,
      text: null,
      isUploading: false,
      uploadProgress: null,
      left_transition_id: null,
      right_transition_id: null,
      groupped_scrubbers: groupedScrubber.groupped_scrubbers,
    };

    setMediaBinItems((prev) => [...prev, newItem]);
  }, []);

  return {
    mediaBinItems,
    isMediaLoading,
    getMediaBinItems,
    setTextItems,
    handleAddMediaToBin,
    handleAddTextToBin,
    handleDeleteMedia,
    handleSplitAudio,
    handleAddGroupToMediaBin,
    contextMenu,
    handleContextMenu,
    handleDeleteFromContext,
    handleSplitAudioFromContext,
    handleCloseContextMenu,
  };
};
