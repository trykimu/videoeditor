import axios from "axios"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { type MediaBinItem, type TimelineState } from "~/components/timeline/types"
import { apiUrl } from "~/utils/api"
import { generateUUID } from "~/utils/uuid"

// Delete media file from server
export const deleteMediaFile = async (filename: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(apiUrl(`/media/${encodeURIComponent(filename)}`), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Clone/copy media file on server
export const cloneMediaFile = async (filename: string, originalName: string, suffix: string): Promise<{ success: boolean; filename?: string; originalName?: string; url?: string; fullUrl?: string; size?: number; error?: string }> => {
  try {
    const response = await fetch(apiUrl('/clone-media'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        originalName,
        suffix
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to clone file');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Clone API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};


// Helper function to get media metadata
const getMediaMetadata = (file: File, mediaType: "video" | "image" | "audio"): Promise<{
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
          height
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
          height
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
          height: 0
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

export const useMediaBin = (handleDeleteScrubbersByMediaBinId: (mediaBinId: string) => void, handleDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void,
  handleAddTrack: () => void,
  timeline: TimelineState,) => {
  const [mediaBinItems, setMediaBinItems] = useState<MediaBinItem[]>([])
  const [pendingDrops, setPendingDrops] = useState<Array<{ item: MediaBinItem, trackId: string }>>([])

  // Helper function to find the first empty track or create a new one
  const findOrCreateEmptyTrack = useCallback(() => {
    // Find the first track that has no scrubbers
    const emptyTrackIndex = timeline.tracks.findIndex(track => track.scrubbers.length === 0);

    if (emptyTrackIndex !== -1) {
      // Found an empty track, return its ID
      return timeline.tracks[emptyTrackIndex].id;
    } else {
      // No empty tracks found, create a new one
      handleAddTrack();
      // Return the ID of the newly created track (it will be the last one)
      return timeline.tracks[timeline.tracks.length]?.id || null;
    }
  }, [timeline.tracks, handleAddTrack]);

  // Helper function to drop media on a track
  const dropMediaOnTrack = useCallback((item: MediaBinItem, trackId: string) => {
    handleDropOnTrack(item, trackId, 0); // Drop at position 0 (beginning of timeline)
  }, [handleDropOnTrack]);

  // Process pending drops when timeline changes
  useEffect(() => {
    if (pendingDrops.length > 0) {
      // Find the first empty track
      const emptyTrackIndex = timeline.tracks.findIndex(track => track.scrubbers.length === 0);
      if (emptyTrackIndex !== -1) {
        const emptyTrackId = timeline.tracks[emptyTrackIndex].id;
        // Process all pending drops
        pendingDrops.forEach(({ item }) => {
          dropMediaOnTrack(item, emptyTrackId);
        });
        setPendingDrops([]); // Clear pending drops
      }
    }
  }, [timeline.tracks, pendingDrops, dropMediaOnTrack]);

  const handleAddMediaToBin = useCallback(async (file: File) => {
    const id = generateUUID();
    const name = file.name;
    let mediaType: "video" | "image" | "audio";
    if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("audio/")) mediaType = "audio";
    else {
      alert("Unsupported file type. Please select a video or image.");
      return;
    }

    console.log("Adding to bin:", name, mediaType);

    try {
      const mediaUrlLocal = URL.createObjectURL(file);

      console.log(`Parsing ${mediaType} file for metadata...`);
      const metadata = await getMediaMetadata(file, mediaType);
      console.log("Media metadata:", metadata);

      // Add item to media bin immediately with upload progress tracking
      const newItem: MediaBinItem = {
        id,
        name,
        mediaType,
        mediaUrlLocal,
        mediaUrlRemote: null, // Will be set after successful upload
        durationInSeconds: metadata.durationInSeconds ?? 0,
        media_width: metadata.width > 400 ? 400 : metadata.width,
        media_height: metadata.height > 411 ? 411 : metadata.height,
        text: null,
        isUploading: true,
        uploadProgress: 0,
      };
      setMediaBinItems(prev => [...prev, newItem]);
      console.log("Media bin items:", newItem);

      const formData = new FormData();
      formData.append('media', file);

      console.log("Uploading file to server...");
      const uploadToastId = toast.loading(`Importing ${name}...`, { duration: Infinity });
      const uploadResponse = await axios.post(apiUrl('/upload'), formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            toast.message(`Importing ${name}: ${percentCompleted}%`, { id: uploadToastId });
            // Update upload progress in the media bin
            setMediaBinItems(prev =>
              prev.map(item =>
                item.id === id
                  ? { ...item, uploadProgress: percentCompleted }
                  : item
              )
            );
          }
        }
      });

      const uploadResult = uploadResponse.data;
      console.log("Upload successful:", uploadResult);

      // Update item with successful upload result and remove progress tracking
      console.log("Updating media bin items");
      const updatedItem = {
        ...newItem,
        mediaUrlRemote: uploadResult.fullUrl,
        isUploading: false,
        uploadProgress: null
      };

      setMediaBinItems(prev =>
        prev.map(item =>
          item.id === id ? updatedItem : item
        )
      );
      console.log("Media bin items:", updatedItem);

      // Find or create an empty track and drop the media
      const targetTrackId = findOrCreateEmptyTrack();
      if (targetTrackId) {
        dropMediaOnTrack(updatedItem, targetTrackId);
      } else {
        // If no track ID returned (new track was created), add to pending drops
        setPendingDrops(prev => [...prev, { item: updatedItem, trackId: '' }]);
      }

      toast.success(`Imported ${name} successfully!`, { id: uploadToastId });

    } catch (error) {
      toast.error(`Failed to import ${name}`, { duration: 4000 });
      console.error("Error adding media to bin:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Remove the failed item from media bin
      setMediaBinItems(prev => prev.filter(item => item.id !== id));

      throw new Error(`Failed to add media: ${errorMessage}`);
    }
  }, [timeline.tracks, handleDropOnTrack, findOrCreateEmptyTrack, dropMediaOnTrack]);

  const handleAddTextToBin = useCallback((
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold"
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
      },
      mediaUrlLocal: null,
      mediaUrlRemote: null,
      durationInSeconds: 0,
      isUploading: false,
      uploadProgress: null,
    };
    setMediaBinItems(prev => [...prev, newItem]);

    // Find or create an empty track and drop the text
    const targetTrackId = findOrCreateEmptyTrack();
    if (targetTrackId) {
      dropMediaOnTrack(newItem, targetTrackId);
    } else {
      // If no track ID returned (new track was created), add to pending drops
      setPendingDrops(prev => [...prev, { item: newItem, trackId: '' }]);
    }
  }, [timeline.tracks, handleDropOnTrack, findOrCreateEmptyTrack, dropMediaOnTrack]);

  const handleUpdateTextInBin = useCallback((id: string, textContent: string) => {
    setMediaBinItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, text: { ...item.text!, textContent } } : item
      )
    );
  }, []);

  return {
    mediaBinItems,
    handleAddMediaToBin,
    handleAddTextToBin,
    // handleDeleteMedia,
    // handleSplitAudio,
    // contextMenu,
    // handleContextMenu,
    // handleDeleteFromContext,
    // handleSplitAudioFromContext,
    // handleCloseContextMenu,
  }
} 