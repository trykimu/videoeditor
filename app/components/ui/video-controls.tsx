import type { PlayerRef } from "@remotion/player";
import React, { useCallback, useEffect, useState } from "react";
import { Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { Button } from "~/components/ui/button";

// Mute Button Component
export const MuteButton: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ playerRef }) => {
  const [muted, setMuted] = useState(playerRef.current?.isMuted() ?? false);

  const onClick = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    if (playerRef.current.isMuted()) {
      playerRef.current.unmute();
    } else {
      playerRef.current.mute();
    }
  }, [playerRef]);

  useEffect(() => {
    const { current } = playerRef;
    if (!current) {
      return;
    }

    const onMuteChange = () => {
      setMuted(current.isMuted());
    };

    current.addEventListener("mutechange", onMuteChange);
    return () => {
      current.removeEventListener("mutechange", onMuteChange);
    };
  }, [playerRef]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-6 w-6 p-0"
      title={muted ? "Unmute" : "Mute"}
    >
      {muted ? (
        <VolumeX className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
    </Button>
  );
};

// Fullscreen Button Component
export const FullscreenButton: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ playerRef }) => {
  const [supportsFullscreen, setSupportsFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const { current } = playerRef;

    if (!current) {
      return;
    }

    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    current.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      current.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [playerRef]);

  useEffect(() => {
    // Must be handled client-side to avoid SSR hydration mismatch
    setSupportsFullscreen(
      (typeof document !== "undefined" &&
        (document.fullscreenEnabled ||
          // @ts-expect-error Types not defined
          document.webkitFullscreenEnabled)) ??
        false
    );
  }, []);

  const onClick = useCallback(() => {
    const { current } = playerRef;
    if (!current) {
      return;
    }

    if (isFullscreen) {
      current.exitFullscreen();
    } else {
      current.requestFullscreen();
    }
  }, [isFullscreen, playerRef]);

  if (!supportsFullscreen) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-6 w-6 p-0"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? (
        <Minimize className="h-3 w-3" />
      ) : (
        <Maximize className="h-3 w-3" />
      )}
    </Button>
  );
};
