import { useState, useCallback } from "react"
import { parseMedia } from '@remotion/media-parser'
import { type MediaBinItem } from "~/components/timeline/types"
import { generateUUID } from "~/utils/uuid"

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
      let durationInSeconds: number | undefined = undefined;
      const mediaUrlLocal = URL.createObjectURL(file);

      if (mediaType === "video") {
        console.log("Parsing video file for duration...");
        const parsedMedia = await parseMedia({
          src: file,
          fields: { durationInSeconds: true }
        });
        durationInSeconds = parsedMedia.durationInSeconds === null ? undefined : parsedMedia.durationInSeconds;
        console.log("Video duration:", durationInSeconds, "seconds");
      }

      const formData = new FormData();
      formData.append('media', file);

      console.log("Uploading file to server...");
      const uploadResponse = await fetch('http://localhost:8000/upload', {
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
        durationInSeconds,
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
    };
    setMediaBinItems(prev => [...prev, newItem]);
  }, []);

  return {
    mediaBinItems,
    handleAddMediaToBin,
    handleAddTextToBin,
  }
} 