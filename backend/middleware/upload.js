const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

// Use memory storage — we manually save to GridFS after upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

// Save buffer to GridFS and return file info
async function saveToGridFS(buffer, originalname) {
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "medicalReports" });
  const filename = `${Date.now()}-${originalname}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { contentType: "application/pdf" });
    uploadStream.on("finish", () => resolve({ id: uploadStream.id, filename }));
    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

// Middleware that uploads to GridFS after multer processes it
function uploadToGridFS(fieldName) {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const result = await saveToGridFS(req.file.buffer, req.file.originalname);
        req.file.id = result.id;
        req.file.filename = result.filename;
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

module.exports = { upload, uploadToGridFS, saveToGridFS };
