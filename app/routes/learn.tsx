import {Player} from '@remotion/player';
import {MyComp} from '~/remotion/MyComp';
 
export default function Learn() {
  return (
    <Player
      component={MyComp}
      inputProps={{text: 'World'}}
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
  );
};