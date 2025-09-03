import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import express, { type Request, type Response } from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { safeResolveOutPath, createSafeFilename, ensureDirectoryExists, isValidFilename } from "~/utils/path-security";

// The composition you want to render
const compositionId = "TimelineComposition";

// You only have to create a bundle once, and you may reuse it
// for multiple renders that you can parametrize using input props.
const bundleLocation = await bundle({
  entryPoint: path.resolve("./app/videorender/index.ts"),
  // If you have a webpack override in remotion.config.ts, pass it here as well.
  webpackOverride: (config) => config,
});

console.log(bundleLocation);

// Ensure output directory exists
ensureDirectoryExists("out");

const app = express();
app.use(express.json());
app.use(cors());

// Static file serving for the out/ directory
// REMOVED: Direct media serving - all asset access must go through authenticated API
// app.use('/media', express.static(path.resolve('out'), {
//   dotfiles: 'deny',
//   index: false
// }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure out directory exists
    ensureDirectoryExists("out");
    cb(null, "out/");
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp using utility function
    const uniqueName = createSafeFilename(file.originalname);
    cb(null, uniqueName);
  },
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
      cb(new Error("Invalid file type. Only media files are allowed."));
    }
  },
});

// Internal media serving for Remotion composition only (Docker network access)
app.get("/media/:filename", (req: Request, res: Response): void => {
  try {
    const filename = req.params.filename;
    const decodedFilename = decodeURIComponent(filename);

    // Safely resolve the file path
    const filePath = safeResolveOutPath(decodedFilename);
    if (!filePath) {
      res.status(403).json({ error: "Invalid filename" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Serve the file for internal use
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving media file:", error);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

// File upload endpoint
app.post("/upload", upload.single("media"), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Validate the uploaded file path is safe
    const safePath = safeResolveOutPath(req.file.filename);
    if (!safePath) {
      res.status(400).json({ error: "Invalid filename generated" });
      return;
    }

    const fileUrl = `/media/${encodeURIComponent(req.file.filename)}`;
    const fullUrl = `http://localhost:${port}${fileUrl}`; // For internal Remotion composition only

    console.log(`📁 File uploaded: ${req.file.originalname} -> ${req.file.filename}`);

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      fullUrl: fullUrl,
      size: req.file.size,
      path: req.file.path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Bulk file upload endpoint
app.post("/upload-multiple", upload.array("media", 10), (req: Request, res: Response): void => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => {
      // Validate each uploaded file path is safe
      const safePath = safeResolveOutPath(file.filename);
      if (!safePath) {
        throw new Error(`Invalid filename generated: ${file.filename}`);
      }

      return {
        filename: file.filename,
        originalName: file.originalname,
        url: `/media/${encodeURIComponent(file.filename)}`,
        fullUrl: `http://localhost:${port}/media/${encodeURIComponent(file.filename)}`, // For internal Remotion composition only
        size: file.size,
        path: file.path,
      };
    });

    console.log(`📁 ${uploadedFiles.length} files uploaded`);

    res.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Bulk file upload failed" });
  }
});

// Clone/copy media file endpoint
app.post("/clone-media", (req: Request, res: Response): void => {
  try {
    const { filename, originalName, suffix } = req.body;

    if (!filename) {
      res.status(400).json({ error: "Filename is required" });
      return;
    }

    // Safely resolve the source file path
    const sourcePath = safeResolveOutPath(filename);
    if (!sourcePath) {
      res.status(403).json({ error: "Invalid filename" });
      return;
    }

    if (!fs.existsSync(sourcePath)) {
      res.status(404).json({ error: "Source file not found" });
      return;
    }

    // Generate new filename with timestamp and suffix
    const newFilename = createSafeFilename(filename, suffix);

    // Safely resolve the destination path
    const destPath = safeResolveOutPath(newFilename);
    if (!destPath) {
      res.status(400).json({ error: "Invalid destination filename generated" });
      return;
    }

    // Copy the file
    fs.copyFileSync(sourcePath, destPath);

    const fileStats = fs.statSync(destPath);
    const fileUrl = `/media/${encodeURIComponent(newFilename)}`;
    const fullUrl = `http://localhost:${port}${fileUrl}`; // For internal Remotion composition only

    console.log(`📋 File cloned: ${filename} -> ${newFilename}`);

    res.json({
      success: true,
      filename: newFilename,
      originalName: originalName || filename,
      url: fileUrl,
      fullUrl: fullUrl,
      size: fileStats.size,
      path: destPath,
    });
  } catch (error) {
    console.error("Clone error:", error);
    res.status(500).json({ error: "Failed to clone file" });
  }
});

// Delete file endpoint
app.delete("/media/:filename", (req: Request, res: Response): void => {
  try {
    const filename = req.params.filename;

    // Safely resolve the file path
    const filePath = safeResolveOutPath(filename);
    if (!filePath) {
      res.status(403).json({ error: "Invalid filename" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    fs.unlinkSync(filePath);
    console.log(`🗑️ File deleted: ${filename}`);

    res.json({
      success: true,
      message: `File ${filename} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Health check endpoint to monitor system resources
app.get("/health", (req, res) => {
  const used = process.memoryUsage();
  res.json({
    status: "ok",
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    },
    uptime: `${Math.round(process.uptime())} seconds`,
  });
});

app.post("/render", async (req, res) => {
  try {
    // Get input props from POST body
    const inputProps = {
      timelineData: req.body.timelineData,
      durationInFrames: req.body.durationInFrames,
      compositionWidth: req.body.compositionWidth,
      compositionHeight: req.body.compositionHeight,
      getPixelsPerSecond: req.body.getPixelsPerSecond,
      isRendering: true,
    };

    // console.log("Input props:", typeof inputProps.compositionWidth);
    console.log("Input props:", JSON.stringify(inputProps, null, 2));
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
      codec: "h264",
      outputLocation: `out/${compositionId}.mp4`,
      inputProps,
      // Optimized settings for server hardware
      concurrency: 3, // Use 3 cores, leave 1 for system
      verbose: true,
      logLevel: "info", // More detailed logging for server monitoring
      // Balanced encoding settings for server performance
      ffmpegOverride: ({ args }) => {
        return [
          ...args,
          "-preset",
          "fast", // Good balance of speed and quality
          "-crf",
          "28", // Better quality than ultrafast setting
          "-threads",
          "3", // Use 3 threads for encoding
          "-tune",
          "film", // Better quality for general content
          "-x264-params",
          "ref=3:me=hex:subme=6:trellis=1", // Better quality settings
          "-g",
          "30", // Standard keyframe interval
          "-bf",
          "2", // Allow some B-frames for better compression
          "-maxrate",
          "5M", // Limit bitrate to prevent memory issues
          "-bufsize",
          "10M", // Buffer size for rate control
        ];
      },
      timeoutInMilliseconds: 900000, // 15 minute timeout for longer videos
    });

    console.log("✅ Render completed successfully");
    res.sendFile(path.resolve(`out/${compositionId}.mp4`));
  } catch (err) {
    console.error("❌ Render failed:", err);

    // Clean up failed renders
    try {
      const outputPath = `out/${compositionId}.mp4`;
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log("🧹 Cleaned up partial file");
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Could not clean up:", cleanupErr);
    }

    res.status(500).json({
      error: "Video rendering failed",
      message: "Your laptop might be under heavy load. Try closing other apps and rendering again.",
      tip: "Videos are limited to 5 seconds at half resolution for performance.",
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
  console.log(`📋 Clone media: POST http://localhost:${port}/clone-media`);
  console.log(`🗑️ Delete file: DELETE http://localhost:${port}/media/:filename`);
  console.log(`🖥️ Optimized for 4vCPU, 8GB RAM server:`);
  console.log(`   - Multi-threaded processing (3 cores)`);
  console.log(`   - Balanced quality/speed encoding`);
  console.log(`   - Full resolution rendering`);
  console.log(`   - 15-minute timeout for longer videos`);
  console.log(`📂 Media files are served from: ${path.resolve("out")}`);
});
