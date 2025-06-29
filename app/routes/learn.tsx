import { Player } from "@remotion/player";
import { AbsoluteFill, Video, Sequence } from "remotion";


export default function Learn() {
  return (
    <Player
      component={() => (
        <AbsoluteFill>
          <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
        </AbsoluteFill>
      )}
      durationInFrames={100}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
    />
  );
}