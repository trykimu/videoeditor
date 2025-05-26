// this is the video player component. It basically takes the JSON representation of the timeline and renders it.

import { Player } from '@remotion/player';
import { Sequence } from 'remotion';


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
                <Sequence from={Math.round(scrubber.startTime * 4)} durationInFrames={Math.round(scrubber.duration * 4)} key={scrubber.id}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        width: '100%'
                    }}>
                        <p style={{ 
                            color: 'white',
                            fontSize: '48px',
                            fontFamily: 'Arial, sans-serif',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            margin: 0,
                            padding: '20px'
                        }}>{scrubber.id}</p>
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

// // Component that renders text at specific times
// const TextComponent: React.FC<{ text: string; startTime: number; duration: number }> = ({
//     text,
//     startTime,
//     duration
// }) => {
//     return (
//         <div
//             style={{
//                 position: 'absolute',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 fontSize: '48px',
//                 fontFamily: 'Arial',
//                 color: 'white',
//                 textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
//             }}
//         >
//             {text}
//         </div>
//     );
// };

// // Main composition that handles all text elements
// const TimelineComposition: React.FC<{ timelineData: TimelineData[] }> = ({ timelineData }) => {
//     return (
//         <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
//             {timelineData.flatMap((timeline) =>
//                 timeline.scrubbers.map((scrubber) => (
//                     <TextComponent
//                         key={scrubber.id}
//                         text={`Text ${scrubber.id}`}
//                         startTime={scrubber.startTime}
//                         duration={scrubber.duration}
//                     />
//                 ))
//             )}
//         </div>
//     );
// };

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ timelineData }) => {
    // console.log('Timeline Data => ', JSON.stringify(timelineData, null, 2));
    // Calculate total duration from all timelines
    // const totalDuration = useCallback(() => {
    //     return Math.max(...timelineData.map(timeline => timeline.totalDuration));
    // }, [timelineData]);

    return (
        <Player
            component={TimelineComposition}
            inputProps={{ timelineData }}
            durationInFrames={500}
            // durationInFrames={Math.ceil(totalDuration() * 30)} // Convert seconds to frames (30fps)
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
                width: '100%',
                height: '100%',
            }}
            controls
        />
    );
};
