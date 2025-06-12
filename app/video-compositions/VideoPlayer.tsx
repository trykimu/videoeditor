import { Player, type PlayerRef } from '@remotion/player';
import { Sequence, AbsoluteFill, Img, Video } from 'remotion';
import React from 'react';
import type { TimelineDataItem, VideoPlayerProps } from '~/components/timeline/types';

type TimelineCompositionProps = {
    timelineData: TimelineDataItem[];
    isRendering: boolean;   // it's either render (True) or preview (False)
}

export function TimelineComposition({ timelineData, isRendering }: TimelineCompositionProps) {
    console.log('Timeline Data => ', JSON.stringify(timelineData, null, 2));
    // for this experiment it is all text that we are working with.
    const items: React.ReactNode[] = []
    const FPS = 30; // Assuming 30 FPS as set in VideoPlayer

    for (const timeline of timelineData) {
        for (const scrubber of timeline.scrubbers) {
            let content: React.ReactNode = null;

            switch (scrubber.mediaType) {
                case 'text':
                    content = (
                        <AbsoluteFill style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <div style={{
                                textAlign: scrubber.textStyle?.textAlign || 'center',
                                width: '100%'
                            }}>
                                <p style={{
                                    color: scrubber.textStyle?.color || 'white',
                                    fontSize: scrubber.textStyle?.fontSize ? `${scrubber.textStyle.fontSize}px` : '48px',
                                    fontFamily: scrubber.textStyle?.fontFamily || 'Arial, sans-serif',
                                    fontWeight: scrubber.textStyle?.fontWeight || 'normal',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                    margin: 0,
                                    padding: '20px'
                                }}>{scrubber.textContent || "insert text here"}</p>
                            </div>
                        </AbsoluteFill>
                    );
                    break;
                case 'image': {
                    const imageUrl = isRendering ? scrubber.mediaUrlRemote : scrubber.mediaUrlLocal;
                    content = (
                        <AbsoluteFill>
                            <Img src={imageUrl!} />
                        </AbsoluteFill>
                    );
                    break;
                }
                case 'video': {
                    const videoUrl = isRendering ? scrubber.mediaUrlRemote : scrubber.mediaUrlLocal;
                    content = (
                        <AbsoluteFill>
                            <Video src={videoUrl!} />
                        </AbsoluteFill>
                    );
                    break;
                }
                default:
                    console.warn(`Unknown media type: ${scrubber.mediaType}`);
                    break;
            }

            if (content) {
                items.push(
                    <Sequence from={Math.round(scrubber.startTime * FPS)} durationInFrames={Math.round(scrubber.duration * FPS)} key={scrubber.id}>
                        {content}
                    </Sequence>
                );
            }
        }
    }

    return (
        <div>
            {items}
        </div>
    )
}

export function VideoPlayer({ timelineData, durationInFrames, ref, compositionWidth, compositionHeight }: VideoPlayerProps) {
    // Calculate composition width if not provided
    if (compositionWidth === null) {
        let maxWidth = 0;
        for (const item of timelineData) {
            for (const scrubber of item.scrubbers) {
                if (scrubber.media_width !== null && scrubber.media_width > maxWidth) {
                    maxWidth = scrubber.media_width;
                }
            }
        }
        compositionWidth = maxWidth || 1920; // Default to 1920 if no media found
    }

    // Calculate composition height if not provided
    if (compositionHeight === null) {
        let maxHeight = 0;
        for (const item of timelineData) {
            for (const scrubber of item.scrubbers) {
                if (scrubber.media_height !== null && scrubber.media_height > maxHeight) {
                    maxHeight = scrubber.media_height;
                }
            }
        }
        compositionHeight = maxHeight || 1080; // Default to 1080 if no media found
    }

    return (
        <Player
            ref={ref}
            component={TimelineComposition}
            inputProps={{ timelineData, durationInFrames, isRendering: false }}
            durationInFrames={durationInFrames || 10}
            compositionWidth={compositionWidth}
            compositionHeight={compositionHeight}
            fps={30}
            style={{
                width: '100%',
                height: '100%',
            }}
            controls
        />
    );
} 