import { Player } from '@remotion/player';
import { MyComp } from '~/remotion/MyComp';
import { useState, useEffect, type ChangeEvent } from 'react';

export default function Learn() {
  const [videoURL, setVideoURL] = useState<string | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (videoURL && videoURL.startsWith('blob:')) {
        URL.revokeObjectURL(videoURL);
      }
      const newUrl = URL.createObjectURL(file);
      setVideoURL(newUrl);
    }
  };

  useEffect(() => {
    // Cleanup function to revoke the object URL when the component unmounts
    // or when the videoURL changes to a new blob URL.
    return () => {
      if (videoURL && videoURL.startsWith('blob:')) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [videoURL]);

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 ease-in-out"
      />
      {videoURL && (
        <Player
          component={MyComp}
          inputProps={{ videoURL: videoURL }}
          durationInFrames={500}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          style={{
            width: 1280,
            height: 720,
          }}
          controls
        />
      )}
    </div>
  );
};