import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { getDataDir } from "./db";

const DATA_DIR = getDataDir();

type FileCategory = "jd-images" | "resumes" | "exports";

export function saveUploadedFile(
  buffer: Buffer,
  category: FileCategory,
  originalFilename: string,
): { filePath: string; relativePath: string } {
  const dir = path.join(DATA_DIR, category);
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(originalFilename) || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    relativePath: `/data/${category}/${filename}`,
  };
}

export function getAbsolutePath(relativePath: string): string {
  // Handle /data/... paths (used in DB) → resolve to DATA_DIR
  if (relativePath.startsWith("/data/")) {
    return path.join(DATA_DIR, relativePath.replace("/data/", ""));
  }
  return relativePath;
}

export function deleteFile(relativePath: string): void {
  const abs = getAbsolutePath(relativePath);
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    // ignore missing files
  }
}

export function fileExists(relativePath: string): boolean {
  return fs.existsSync(getAbsolutePath(relativePath));
}

export function readFile(relativePath: string): Buffer {
  return fs.readFileSync(getAbsolutePath(relativePath));
}
