import { Router, type IRouter } from "express";
import multer from "multer";
import { extname } from "path";
import { randomUUID } from "crypto";
import { UPLOAD_DIR } from "../app";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

const ALLOWED_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (ALLOWED_IMAGE_EXTS.has(ext)) cb(null, true);
    else cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
  },
});

/**
 * POST /uploads/image
 * Simple multer-based image upload. Returns { url: "/api/uploads/<filename>" }.
 * No object storage required.
 */
router.post("/uploads/image", withCurrentUser, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file provided" });
    return;
  }
  res.json({ url: `/api/uploads/${req.file.filename}` });
});

export default router;
