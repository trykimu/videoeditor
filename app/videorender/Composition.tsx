import { Composition, getInputProps } from 'remotion';
import { TimelineComposition } from '../video-compositions/VideoPlayer';

export default function RenderComposition() {
    const inputProps = getInputProps();
    console.log("Input props:", inputProps);
    return (
        <Composition
            id="TimelineComposition"
            component={TimelineComposition}
            durationInFrames={(inputProps.durationInFrames as number) ?? 300}   // this is for some hacky reason i forgot. welp.
            fps={30}
            width={inputProps.compositionWidth as number}
            height={inputProps.compositionHeight as number}
            defaultProps={{
                timelineData: [
                    {
                        id: "1",
                        totalDuration: 10,
                        scrubbers: [
                            { id: "1-1", startTime: 0, endTime: 3, duration: 3, mediaType: "text", width: 80, trackId: "1", trackIndex: 0, media_width: 80, media_height: 80 },
                        ],
                    }
                ],
                isRendering: false
            }}
        />
    )
}