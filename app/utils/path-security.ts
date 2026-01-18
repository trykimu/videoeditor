import path from "path";
import fs from "fs";

/**
 * Utility functions for secure path operations
 * Prevents path traversal attacks and ensures files stay within intended directories
 */

/**
 * Safely resolves a file path within a specified base directory
 * @param baseDir - The base directory to confine files to (e.g., "out")
 * @param filename - The filename to resolve
 * @returns The resolved absolute path if safe, null if unsafe
 */
export function safeResolvePath(baseDir: string, filename: string): string | null {
  try {
    // Sanitize filename - remove any path traversal attempts
    const sanitizedFilename = path.basename(filename);

    // Only allow alphanumeric, hyphens, underscores, dots, and timestamps
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedFilename)) {
      return null;
    }

    // Resolve the path and ensure it's within the base directory
    const resolvedPath = path.resolve(baseDir, sanitizedFilename);
    const baseDirResolved = path.resolve(baseDir);

    // Security check - ensure resolved path is within base directory
    if (!resolvedPath.startsWith(baseDirResolved) || resolvedPath === baseDirResolved) {
      return null;
    }

    return resolvedPath;
  } catch (error) {
    return null;
  }
}

/**
 * Safely resolves a file path within the "out" directory (common use case)
 * @param filename - The filename to resolve
 * @returns The resolved absolute path if safe, null if unsafe
 */
export function safeResolveOutPath(filename: string): string | null {
  return safeResolvePath("out", filename);
}

/**
 * Validates if a filename is safe (no path traversal, valid characters)
 * @param filename - The filename to validate
 * @returns true if safe, false if unsafe
 */
export function isValidFilename(filename: string): boolean {
  try {
    const sanitizedFilename = path.basename(filename);
    return /^[a-zA-Z0-9._-]+$/.test(sanitizedFilename);
  } catch (error) {
    return false;
  }
}

/**
 * Sanitizes a filename by removing unsafe characters and path traversal attempts
 * @param filename - The filename to sanitize
 * @returns The sanitized filename, or null if too unsafe
 */
export function sanitizeFilename(filename: string): string | null {
  try {
    const sanitized = path.basename(filename);

    // Remove any remaining unsafe characters
    const cleaned = sanitized.replace(/[^a-zA-Z0-9._-]/g, "");

    // Return null if the filename becomes empty or too short
    if (!cleaned || cleaned.length < 1) {
      return null;
    }

    return cleaned;
  } catch (error) {
    return null;
  }
}

/**
 * Creates a safe filename with timestamp and optional suffix
 * @param originalName - The original filename
 * @param suffix - Optional suffix to add
 * @returns A safe filename with timestamp
 */
export function createSafeFilename(originalName: string, suffix?: string): string {
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);

  // Sanitize the base name
  const sanitizedBase = sanitizeFilename(nameWithoutExt) || "file";

  // Sanitize suffix if provided
  const sanitizedSuffix = suffix ? sanitizeFilename(suffix) || "" : "";

  // Combine parts
  const parts = [sanitizedBase];
  if (sanitizedSuffix) {
    parts.push(sanitizedSuffix);
  }
  parts.push(timestamp.toString());

  return `${parts.join("_")}${extension}`;
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - The directory path to ensure
 * @returns true if successful, false if failed
 */
export function ensureDirectoryExists(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a file path is within a specified base directory
 * @param filePath - The file path to check
 * @param baseDir - The base directory to check against
 * @returns true if the file is within the base directory, false otherwise
 */
export function isPathWithinDirectory(filePath: string, baseDir: string): boolean {
  try {
    const resolvedFilePath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(baseDir);

    return resolvedFilePath.startsWith(resolvedBaseDir) && resolvedFilePath !== resolvedBaseDir;
  } catch (error) {
    return false;
  }
}
