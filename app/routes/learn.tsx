import {Thumbnail} from '@remotion/player';
import { OffthreadVideo, Img } from 'remotion'; 

export default function Learn() {
  return (
    <Thumbnail
      component={() => (
        <div>
          {/* <Img src="https://archive.org/download/placeholder-image//placeholder-image.jpg" /> */}
          <OffthreadVideo src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
        </div>
      )}
      compositionWidth={600}
      compositionHeight={600}
      frameToDisplay={30}
      durationInFrames={120}
      fps={30}
    />
  );
};