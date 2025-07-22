// import { Player } from '@remotion/player';
// import {AbsoluteFill, Audio} from 'remotion';

// export const MyComposition = () => {
//   return (
//     <AbsoluteFill>
//       <Audio src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
//     </AbsoluteFill>
//   );
// };


// export default function Learn() {
//   return (
//     <Player
//       component={MyComposition}
//       durationInFrames={12000}
//       fps={30}
//       compositionWidth={600}
//       compositionHeight={600}
//       controls
//     />
//   )
// }



import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { AbsoluteFill } from "remotion";

import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";

export const MyComp: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <AbsoluteFill style={{ backgroundColor: "blue" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={springTiming({ config: { damping: 200 } })}
        presentation={fade()}
      />
      <TransitionSeries.Sequence durationInFrames={60}>
        <AbsoluteFill style={{ backgroundColor: "black" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 30 })}
        presentation={wipe()}
      />
      <TransitionSeries.Sequence durationInFrames={60}>
        <AbsoluteFill style={{ backgroundColor: "white" }} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export default function Learn() {
  const playerRef = useRef<PlayerRef>(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };

    player.addEventListener('frameupdate', onFrameUpdate);

    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <Player
        ref={playerRef}
        component={MyComp}
        durationInFrames={180}
        fps={30}
        controls
        compositionWidth={600}
        compositionHeight={600}
      />
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        backgroundColor: 'black',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        border: '1px solid #ccc'
      }}>
        Frame: {currentFrame} / 179
      </div>
    </div>
  );
}