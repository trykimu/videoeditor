import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { AbsoluteFill, Img, Sequence, Video } from "remotion";

import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";

const Letter: React.FC<{ color: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ color, children, style }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
        fontSize: "200px",
        fontWeight: "bold",
        color: "white",
        textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const MyComp = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={215}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={40}>
            <Letter color="#0b84f3">A</Letter>
            {/* <Video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" /> */}
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={slide()}
            timing={linearTiming({ durationInFrames: 30 })}
          />
          <TransitionSeries.Sequence durationInFrames={60}>
            <Letter color="pink">B</Letter>
            {/* <Video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" /> */}
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={slide()}
            timing={linearTiming({ durationInFrames: 45 })}
          />
          <TransitionSeries.Sequence durationInFrames={90}>
            <Letter color="green">C</Letter>
            {/* <Video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" /> */}
          </TransitionSeries.Sequence>

          <TransitionSeries.Transition
            presentation={iris({ width: 1000, height: 1000 })}
            timing={linearTiming({ durationInFrames: 10 })}
          />

          <TransitionSeries.Sequence durationInFrames={100}>
            <AbsoluteFill>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'green',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: 'yellow',
              }}>
                there's nothing here
              </div>
            </AbsoluteFill>
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Sequence>

      <Sequence from={0} durationInFrames={115}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={40}>
            <Letter color="#0b84f3" style={{ height: '50%', width: '50%', backgroundColor: 'black' }}>A</Letter>
            {/* <Video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" /> */}
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={wipe()}
            timing={linearTiming({ durationInFrames: 30 })}
          />
          <TransitionSeries.Sequence durationInFrames={60}>
            <Letter color="pink" style={{ height: '50%', width: '50%', backgroundColor: 'black' }}>B</Letter>
            {/* <Video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" /> */}
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={flip()}
            timing={linearTiming({ durationInFrames: 45 })}
          />
          <TransitionSeries.Sequence durationInFrames={90}>
            <Letter color="green" style={{ height: '50%', width: '50%', backgroundColor: 'black' }}>C</Letter>
            {/* <Video src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" /> */}
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Sequence>
    </>
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
        durationInFrames={300}
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
        Frame: {currentFrame}
      </div>
    </div>
  );
}