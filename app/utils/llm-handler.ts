// because there is only a fixed set of tools the LLM can use in a video editor, we're going to be writing functions for those tools and then calling them from the LLM.

import { type MediaBinItem, type ScrubberState } from "~/components/timeline/types";

export function llmAddScrubberToTimeline(id: string, mediaBinItems: MediaBinItem[], track: string, dropLeftPx: number, handleDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void) {
    // take a scrubber from the media bin and add it to the timeline. It is best to leave the import to media bin to the user.
    const scrubber = mediaBinItems.find(item => item.id === id);
    if (!scrubber) {
        throw new Error(`Scrubber with id ${id} not found`);
    }
    handleDropOnTrack(scrubber, track, dropLeftPx);
}