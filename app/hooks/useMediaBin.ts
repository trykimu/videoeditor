import { useState, useCallback } from "react"
import { parseMedia } from '@remotion/media-parser'
import { type MediaBinItem } from "~/components/timeline/types"
import { generateUUID } from "~/utils/uuid"
import { apiUrl } from "~/utils/api"

// Helper function to get media metadata
const getMediaMetadata = (file: File, mediaType: "video" | "image"): Promise<{
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
    }
  });
};

export const useMediaBin = () => {
  const [mediaBinItems, setMediaBinItems] = useState<MediaBinItem[]>([])

  const handleAddMediaToBin = useCallback(async (file: File) => {
    const id = generateUUID();
    const name = file.name;
    let mediaType: "video" | "image" = "image";
    if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type.startsWith("image/")) mediaType = "image";
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

      const formData = new FormData();
      formData.append('media', file);

      console.log("Uploading file to server...");
      const uploadResponse = await fetch(apiUrl('/upload'), {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload successful:", uploadResult);

      const newItem: MediaBinItem = {
        id,
        name,
        mediaType,
        mediaUrlLocal,
        mediaUrlRemote: uploadResult.fullUrl,
        durationInSeconds: metadata.durationInSeconds,
        media_width: metadata.width,
        media_height: metadata.height,
      };
      setMediaBinItems(prev => [...prev, newItem]);

    } catch (error) {
      console.error("Error adding media to bin:", error);
      alert(`Failed to add media: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, []);

  const handleAddTextToBin = useCallback(() => {
    const newItem: MediaBinItem = {
      id: generateUUID(),
      name: "Text Element",
      mediaType: "text",
      media_width: null, // text got no dimensions
      media_height: null,
    };
    setMediaBinItems(prev => [...prev, newItem]);
  }, []);

  return {
    mediaBinItems,
    handleAddMediaToBin,
    handleAddTextToBin,
  }
} 