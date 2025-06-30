import { useState, useCallback } from "react"
import axios from "axios"
import { type MediaBinItem } from "~/components/timeline/types"
import { generateUUID } from "~/utils/uuid"
import { apiUrl } from "~/utils/api"

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

export const useMediaBin = () => {
  const [mediaBinItems, setMediaBinItems] = useState<MediaBinItem[]>([])

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
        media_width: metadata.width,
        media_height: metadata.height,
        text: null,
        isUploading: true,
        uploadProgress: 0,
      };
      setMediaBinItems(prev => [...prev, newItem]);

      const formData = new FormData();
      formData.append('media', file);

      console.log("Uploading file to server...");
      const uploadResponse = await axios.post(apiUrl('/upload'), formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);

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
      setMediaBinItems(prev =>
        prev.map(item =>
          item.id === id
            ? {
              ...item,
              mediaUrlRemote: uploadResult.fullUrl,
              isUploading: false,
              uploadProgress: null
            }
            : item
        )
      );

    } catch (error) {
      console.error("Error adding media to bin:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Remove the failed item from media bin
      setMediaBinItems(prev => prev.filter(item => item.id !== id));

      throw new Error(`Failed to add media: ${errorMessage}`);
    }
  }, []);

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
  }, []);

  return {
    mediaBinItems,
    handleAddMediaToBin,
    handleAddTextToBin,
  }
} 