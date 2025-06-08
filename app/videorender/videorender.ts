import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import multer from 'multer';

// The composition you want to render
const compositionId = 'TimelineComposition';

// You only have to create a bundle once, and you may reuse it
// for multiple renders that you can parametrize using input props.
const bundleLocation = await bundle({
  entryPoint: path.resolve('./app/videorender/index.ts'),
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

// Static file serving for the out/ directory
app.use('/media', express.static(path.resolve('out'), {
  // Enable directory browsing (optional)
  dotfiles: 'deny',
  index: false,
  // Set appropriate headers for media files
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.set('Content-Type', 'video/webm');
    } else if (path.endsWith('.mov')) {
      res.set('Content-Type', 'video/quicktime');
    } else if (path.endsWith('.avi')) {
      res.set('Content-Type', 'video/x-msvideo');
    }
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure out directory exists
    if (!fs.existsSync('out')) {
      fs.mkdirSync('out', { recursive: true });
    }
    cb(null, 'out/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const uniqueName = `${nameWithoutExt}_${timestamp}${extension}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit (we'll do no limits later)
  },
  fileFilter: (req, file, cb) => {
    // Accept common media file types
    const allowedTypes = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|mp3|wav|aac|ogg|flac|jpg|jpeg|png|gif|bmp|webp)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only media files are allowed.'));
    }
  }
});

// List files in out/ directory
app.get('/media', (req: Request, res: Response): void => {
  try {
    const outDir = path.resolve('out');
    if (!fs.existsSync(outDir)) {
      res.json({ files: [] });
      return;
    }

    const files = fs.readdirSync(outDir).map(filename => {
      const filePath = path.join(outDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        url: `/media/${encodeURIComponent(filename)}`,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    }).filter(file => !file.isDirectory); // Only show files, not directories

    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// File upload endpoint
app.post('/upload', upload.single('media'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/media/${encodeURIComponent(req.file.filename)}`;
    const fullUrl = `http://localhost:${port}${fileUrl}`; // Direct backend URL for Remotion

    console.log(`📁 File uploaded: ${req.file.originalname} -> ${req.file.filename}`);

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      fullUrl: fullUrl,
      size: req.file.size,
      path: req.file.path
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Bulk file upload endpoint
app.post('/upload-multiple', upload.array('media', 10), (req: Request, res: Response): void => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/media/${encodeURIComponent(file.filename)}`,
      fullUrl: `http://localhost:${port}/media/${encodeURIComponent(file.filename)}`, // Direct backend URL for Remotion
      size: file.size,
      path: file.path
    }));

    console.log(`📁 ${uploadedFiles.length} files uploaded`);

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Bulk file upload failed' });
  }
});

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
      timelineData: req.body.timelineData,
      durationInFrames: req.body.durationInFrames,
      compositionWidth: req.body.compositionWidth,
      compositionHeight: req.body.compositionHeight,
      isRendering: true
    };

    console.log("Input props:", typeof inputProps.compositionWidth);
    // Get the composition you want to render
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // const maxFrames = Math.min(composition.durationInFrames, 150); // Max 5 seconds at 30fps
    // console.log(`Starting ULTRA low-resource render. Limiting to ${maxFrames} frames (${maxFrames / 30}s)`);

    // Render optimized for 4vCPU, 8GB RAM server
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: `out/${compositionId}.mp4`,
      inputProps,
      // Optimized settings for server hardware
      concurrency: 3, // Use 3 cores, leave 1 for system
      verbose: true,
      logLevel: 'info', // More detailed logging for server monitoring
      // Balanced encoding settings for server performance
      ffmpegOverride: ({ args }) => {
        return [
          ...args,
          '-preset', 'fast', // Good balance of speed and quality
          '-crf', '28', // Better quality than ultrafast setting
          '-threads', '3', // Use 3 threads for encoding
          '-tune', 'film', // Better quality for general content
          '-x264-params', 'ref=3:me=hex:subme=6:trellis=1', // Better quality settings
          '-g', '30', // Standard keyframe interval
          '-bf', '2', // Allow some B-frames for better compression
          '-maxrate', '5M', // Limit bitrate to prevent memory issues
          '-bufsize', '10M', // Buffer size for rate control
        ];
      },
      timeoutInMilliseconds: 900000, // 15 minute timeout for longer videos
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
  console.log(`🎬 Video rendering: POST http://localhost:${port}/render`);
  console.log(`📁 Media files: http://localhost:${port}/media/`);
  console.log(`📤 Upload file: POST http://localhost:${port}/upload`);
  console.log(`📤 Upload multiple: POST http://localhost:${port}/upload-multiple`);
  console.log(`🖥️ Optimized for 4vCPU, 8GB RAM server:`);
  console.log(`   - Multi-threaded processing (3 cores)`);
  console.log(`   - Balanced quality/speed encoding`);
  console.log(`   - Full resolution rendering`);
  console.log(`   - 15-minute timeout for longer videos`);
  console.log(`📂 Media files are served from: ${path.resolve('out')}`);
});


