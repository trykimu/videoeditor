import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import express from 'express';
import cors from 'cors';


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

const app = express();
app.use(express.json());
app.use(cors());

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

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: `out/${compositionId}.mp4`,
      inputProps,
      verbose: true, // Enable verbose logging
      logLevel: 'verbose', // Set log level to verbose
    });

    // Send the rendered video file
    res.sendFile(`out/${compositionId}.mp4`, { root: process.cwd() });

  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: 'Failed to render video' });
  }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});