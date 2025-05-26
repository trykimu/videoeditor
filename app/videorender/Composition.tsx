import { Composition } from 'remotion';
import { TimelineComposition } from '../remotion/VideoPlayer';

export default function RenderComposition() {
    return (
        <Composition
            id="TimelineComposition"
            component={TimelineComposition}
            durationInFrames={300}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{
                timelineData: [
                    {
                        id: "1",
                        totalDuration: 10,
                        scrubbers: [
                            { id: "1-1", startTime: 0, endTime: 3, duration: 3 },
                        ],
                    }
                ],
            }}
        />
    )
}