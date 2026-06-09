import { useState, useEffect } from "react";

// How many RMS samples to store per audio file. 2 000 covers ~500 px at 1-px
// bars with 1-px gaps, which is wider than any realistic scrubber.
const NUM_PEAKS = 2000;

// Module-level caches so identical URLs are decoded only once across all
// Scrubber instances, even across React re-mounts.
const peakCache = new Map<string, Float32Array>();
const inFlight = new Map<string, Promise<Float32Array>>();

// Single shared AudioContext — browsers limit simultaneous contexts (~6).
// decodeAudioData is non-blocking (off-thread in the browser engine) so this
// is safe for concurrent calls.
let sharedCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

async function computePeaks(url: string): Promise<Float32Array> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`fetch ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const decoded = await getAudioCtx().decodeAudioData(arrayBuffer);

  // Mix all channels down to mono
  const numCh = decoded.numberOfChannels;
  const len = decoded.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < numCh; c++) {
    const ch = decoded.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += ch[i] / numCh;
  }

  // Compute RMS per block → peaks array
  const blockSize = Math.max(1, Math.floor(len / NUM_PEAKS));
  const peaks = new Float32Array(NUM_PEAKS);
  for (let i = 0; i < NUM_PEAKS; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, len);
    let sum = 0;
    for (let j = start; j < end; j++) sum += mono[j] * mono[j];
    peaks[i] = Math.sqrt(sum / Math.max(1, end - start));
  }

  // Normalise to 0–1
  let max = 0;
  for (let i = 0; i < NUM_PEAKS; i++) if (peaks[i] > max) max = peaks[i];
  if (max > 0) for (let i = 0; i < NUM_PEAKS; i++) peaks[i] /= max;

  return peaks;
}

function requestPeaks(url: string): Promise<Float32Array> {
  const cached = peakCache.get(url);
  if (cached) return Promise.resolve(cached);

  let promise = inFlight.get(url);
  if (!promise) {
    promise = computePeaks(url).then(
      (p) => { peakCache.set(url, p); inFlight.delete(url); return p; },
      (err) => { inFlight.delete(url); throw err; },
    );
    inFlight.set(url, promise);
  }
  return promise;
}

/**
 * Returns normalised RMS peak data (Float32Array, values 0–1) for the given
 * audio URL, or null while loading / on error.
 *
 * Only useful for audio and video clips — pass null for other types.
 */
export function useWaveform(url: string | null | undefined): Float32Array | null {
  const [peaks, setPeaks] = useState<Float32Array | null>(() =>
    url ? (peakCache.get(url) ?? null) : null,
  );

  useEffect(() => {
    if (!url) {
      setPeaks(null);
      return;
    }

    const cached = peakCache.get(url);
    if (cached) {
      setPeaks(cached);
      return;
    }

    let cancelled = false;
    requestPeaks(url).then(
      (p) => { if (!cancelled) setPeaks(p); },
      () => {},
    );

    return () => { cancelled = true; };
  }, [url]);

  return peaks;
}
