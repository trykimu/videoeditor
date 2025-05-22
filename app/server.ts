import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import express from 'express';
import cors from 'cors';
import fs from 'fs';

// The composition you want to render
const compositionId = 'Main';

// You only have to create a bundle once, and you may reuse it
// for multiple renders that you can parametrize using input props.
const bundleLocation = await bundle({
  entryPoint: path.resolve('./app/remotion/index.ts'),
  // If you have a webpack override in remotion.config.ts, pass it here as well.
  webpackOverride: (config) => config,
});

console.log(bundleLocation);

// Ensure output directory exists
if (!fs.existsSync('out')) {
  fs.mkdirSync('out', { recursive: true });
}

const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint to monitor system resources
app.get('/health', (req, res) => {
  const used = process.memoryUsage();
  res.json({
    status: 'ok',
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    },
    uptime: `${Math.round(process.uptime())} seconds`
  });
});

app.post('/render', async (req, res) => {
  try {
    // Get input props from POST body
    const inputProps = {
      title: req.body.title
    };
    
    // Get the composition you want to render
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId, 
      inputProps,
    });

    const maxFrames = Math.min(composition.durationInFrames, 150); // Max 5 seconds at 30fps
    console.log(`Starting ULTRA low-resource render. Limiting to ${maxFrames} frames (${maxFrames/30}s)`);

    // Render with EXTREME optimizations for weak laptops
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: `out/${compositionId}.mp4`,
      inputProps,
      // CRITICAL: Resource-saving settings
      frameRange: [0, maxFrames], // Severely limit duration
      scale: 0.5, // Half resolution = 4x faster rendering
      concurrency: 1, // Single thread only
      // enforceAudioTrack: false, // No audio processing
      verbose: true, // Minimal logging overhead
      // logLevel: 'warn', // Only show warnings/errors
      // Ultra-fast encoding settings
      ffmpegOverride: ({ args }) => {
        return [
          ...args,
          '-preset', 'ultrafast', // Fastest possible
          '-crf', '32', // Lower quality but much faster
          '-threads', '1', // Single thread
          '-tune', 'fastdecode', // Optimize for speed
          '-x264-params', 'ref=1:me=dia:subme=2:trellis=0:weightb=0', // Minimal quality settings
          '-g', '15', // More keyframes for faster encoding
          '-bf', '0', // No B-frames
          '-b_strategy', '0', // Disable advanced B-frame strategies
        ];
      },
      timeoutInMilliseconds: 120000, // 2 minute max timeout
    });

    console.log('✅ Render completed successfully');
    res.sendFile(path.resolve(`out/${compositionId}.mp4`));

  } catch (err) {
    console.error('❌ Render failed:', err);
    
    // Clean up failed renders
    try {
      const outputPath = `out/${compositionId}.mp4`;
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('🧹 Cleaned up partial file');
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Could not clean up:', cleanupErr);
    }
    
    res.status(500).json({ 
      error: 'Video rendering failed',
      message: 'Your laptop might be under heavy load. Try closing other apps and rendering again.',
      tip: 'Videos are limited to 5 seconds at half resolution for performance.'
    });
  }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💻 Optimized for low-resource systems:`);
  console.log(`   - Videos limited to 5 seconds max`);
  console.log(`   - Half resolution rendering`);
  console.log(`   - Single-threaded processing`);
  console.log(`   - Ultra-fast encoding`);
});