import { Composition, Sequence } from 'remotion';


type MediaItem = {
    type: 'image' | 'video';
    src: string;
    startTime: number;
    endTime: number;
}

type TextItems = {
    type: 'text';
    text: string;
    startTime: number;
    endTime: number;
}

type TimelineScrubber = {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
}

type TimelineData = {
    id: string;
    totalDuration: number;
    scrubbers: TimelineScrubber[];
}

type VideoPlayerProps = {
    timelineData: TimelineData[];
}

function TimelineComposition({ timelineData }: VideoPlayerProps) {
    console.log('Timeline Data => ', JSON.stringify(timelineData, null, 2));
    // for this experiment it is all text that we are working with.
    const items: React.ReactNode[] = []

    for (const timeline of timelineData) {
        for (const scrubber of timeline.scrubbers) {
            items.push(
                <Sequence from={Math.round(scrubber.startTime * 4)} durationInFrames={Math.round(scrubber.duration * 4)} key={scrubber.id} >
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        width: '100%'
                    }}>
                        <p style={
                            {
                                color: 'white',
                                fontSize: '48px',
                                fontFamily: 'Arial, sans-serif',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                margin: 0,
                                padding: '20px'
                            }
                        }> {scrubber.id} </p>
                    </div>
                </Sequence>
            )
        }
    }

    return (
        <div>
            {items}
        </div>
    )
}


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