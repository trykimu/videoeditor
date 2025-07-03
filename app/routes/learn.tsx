import { Player } from '@remotion/player';
import {AbsoluteFill, Audio} from 'remotion';
 
export const MyComposition = () => {
  return (
    <AbsoluteFill>
      <Audio src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
    </AbsoluteFill>
  );
};


export default function Learn() {
  return (
    <Player
      component={MyComposition}
      durationInFrames={12000}
      fps={30}
      compositionWidth={600}
      compositionHeight={600}
      controls
    />
  )
}