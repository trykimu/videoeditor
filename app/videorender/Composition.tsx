import { Composition, getInputProps } from 'remotion';
import { TimelineComposition } from '../video-compositions/VideoPlayer';

export default function RenderComposition() {
    const inputProps = getInputProps();
    console.log("Input props:", inputProps);
    return (
        <Composition
            id="TimelineComposition"
            component={TimelineComposition}
            durationInFrames={(inputProps.durationInFrames as number) ?? 300}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{
                timelineData: [
                    {
                        id: "1",
                        totalDuration: 10,
                        scrubbers: [
                            { id: "1-1", startTime: 0, endTime: 3, duration: 3, mediaType: "text", width: 80 },
                        ],
                    }
                ],
                durationInFrames: 300,
            }}
        />
    )
}