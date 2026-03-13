const express = require('express');
const multer = require('multer');
const {
  uploadFiles,
  getFileById,
  applyTemplate,
  batchApplyTemplate,
  downloadFile,
  deleteFile
} = require('../controllers/pdfController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// All PDF routes are protected
router.use(authMiddleware);

// Upload PDF files
router.post('/upload', upload.array('files'), uploadFiles);

// Get file by ID
router.get('/:fileId', getFileById);

// Apply template to PDF
router.post('/apply-template', applyTemplate);

// Batch apply template to multiple PDFs
router.post('/batch-apply-template', batchApplyTemplate);

// Download PDF file
router.get('/download/:fileId', downloadFile);

// Delete a file
router.delete('/:fileId', deleteFile);

module.exports = router;