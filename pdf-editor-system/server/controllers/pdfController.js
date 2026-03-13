const File = require('../models/File');
const Template = require('../models/Template');
const Tournament = require('../models/Tournament');
const { applyTemplateToPdf } = require('../utils/pdfProcessor');
const { uploadToGoogleDrive } = require('../utils/googleDrive');
const fs = require('fs').promises;
const path = require('path');

// Upload PDF files
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { tournamentId } = req.body;
    const uploadedBy = req.user.id;
    const uploadedFiles = [];

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Process each uploaded file
    for (const file of req.files) {
      // Generate a unique filename to avoid collisions
      const uniqueName = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(uploadDir, uniqueName);
      await fs.writeFile(filePath, file.buffer);

      // Create file record in database
      const fileRecord = await File.create({
        tournamentId,
        fileName: file.originalname,
        originalFileUrl: filePath,
        editedFileUrl: null,
        status: 'uploaded',
        uploadedBy
      });

      // Upload raw file to Google Drive Original folder
      if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
        try {
          const tournament = await Tournament.findById(tournamentId);
          if (tournament && tournament.gdrive_original_folder_id) {
            console.log('Uploading original PDF to Google Drive...');
            await uploadToGoogleDrive(file.buffer, file.originalname, tournament.gdrive_original_folder_id);
          }
        } catch (driveErr) {
          console.error('Failed to upload original file to Google Drive.', driveErr);
        }
      }

      uploadedFiles.push(fileRecord);
    }

    res.status(201).json(uploadedFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get file by ID
const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Add a URL the client can use to preview the PDF
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const originalFileName = path.basename(file.original_file_url);
    file.preview_url = `${baseUrl}/uploads/${originalFileName}`;

    if (file.edited_file_url) {
      const editedFileName = path.basename(file.edited_file_url);
      file.edited_preview_url = `${baseUrl}/uploads/${editedFileName}`;
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Apply template to PDF — REAL implementation using pdfProcessor
const applyTemplate = async (req, res) => {
  try {
    const { fileId, templateId, template: templateData } = req.body;

    // Get file information
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get template — either from DB by ID or use the provided template data
    let template = templateData;
    if (templateId && !template) {
      template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    if (!template) {
      return res.status(400).json({ error: 'Template data is required' });
    }

    // Read the original PDF from disk
    const pdfBuffer = await fs.readFile(file.original_file_url);

    // Process the PDF using pdfProcessor
    const editedPdfBuffer = await applyTemplateToPdf(pdfBuffer, template);

    // Save the edited PDF
    const editedFileName = path.basename(file.original_file_url).replace('.pdf', '_edited.pdf');
    const editedFilePath = path.join(path.dirname(file.original_file_url), editedFileName);
    await fs.writeFile(editedFilePath, editedPdfBuffer);

    // Update file record in database
    const updatedFile = await File.update(fileId, {
      fileName: file.file_name,
      originalFileUrl: file.original_file_url,
      editedFileUrl: editedFilePath,
      status: 'edited'
    });

    // Add preview URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    updatedFile.edited_preview_url = `${baseUrl}/uploads/${editedFileName}`;

    // Upload to Google Drive if credentials exist
    let googleDriveData = null;
    if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
      try {
        console.log('Uploading edited PDF to Google Drive...');
        const tournament = await Tournament.findById(file.tournament_id);
        const folderId = tournament ? tournament.gdrive_edited_folder_id : (process.env.GOOGLE_DRIVE_FOLDER_ID || null);
        googleDriveData = await uploadToGoogleDrive(editedPdfBuffer, editedFileName, folderId);
        updatedFile.google_drive_url = googleDriveData.webViewLink;
      } catch (driveErr) {
        console.error('Failed to upload to Google Drive. File saved locally.');
        console.error('FULL DRIVE ERROR:', driveErr);
      }
    }

    res.json({
      message: 'Template applied successfully',
      file: updatedFile,
      googleDrive: googleDriveData
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Batch apply template to multiple PDFs
const batchApplyTemplate = async (req, res) => {
  try {
    const { fileIds, templateId, template: templateData } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    // Get template
    let template = templateData;
    if (templateId && !template) {
      template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    if (!template) {
      return res.status(400).json({ error: 'Template data is required' });
    }

    const results = [];
    const errors = [];

    for (const fileId of fileIds) {
      try {
        const file = await File.findById(fileId);
        if (!file) {
          errors.push({ fileId, error: 'File not found' });
          continue;
        }

        // Read and process PDF
        const pdfBuffer = await fs.readFile(file.original_file_url);
        const editedPdfBuffer = await applyTemplateToPdf(pdfBuffer, template);

        // Save edited PDF
        const editedFileName = path.basename(file.original_file_url).replace('.pdf', '_edited.pdf');
        const editedFilePath = path.join(path.dirname(file.original_file_url), editedFileName);
        await fs.writeFile(editedFilePath, editedPdfBuffer);

        // Update DB
        const updatedFile = await File.update(fileId, {
          fileName: file.file_name,
          originalFileUrl: file.original_file_url,
          editedFileUrl: editedFilePath,
          status: 'edited'
        });

        // Upload to Google Drive if credentials exist
        if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
          try {
            console.log('Uploading batch edited PDF to Google Drive...');
            const tournament = await Tournament.findById(file.tournament_id);
            const folderId = tournament ? tournament.gdrive_edited_folder_id : (process.env.GOOGLE_DRIVE_FOLDER_ID || null);
            const googleDriveData = await uploadToGoogleDrive(editedPdfBuffer, editedFileName, folderId);
            updatedFile.google_drive_url = googleDriveData.webViewLink;
          } catch (driveErr) {
            console.error('Failed to upload batch edited file to Google Drive.', driveErr);
          }
        }

        results.push(updatedFile);
      } catch (err) {
        errors.push({ fileId, error: err.message });
      }
    }

    res.json({
      message: `Processed ${results.length} of ${fileIds.length} files`,
      results,
      errors
    });
  } catch (error) {
    console.error('Error in batch processing:', error);
    res.status(500).json({ error: error.message });
  }
};

// Download PDF file
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine which file to download (edited takes priority)
    const filePath = file.edited_file_url || file.original_file_url;

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Send file
    res.download(filePath, file.file_name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a file
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete files from disk
    try {
      if (file.original_file_url) await fs.unlink(file.original_file_url);
    } catch { /* file may already be gone */ }

    try {
      if (file.edited_file_url) await fs.unlink(file.edited_file_url);
    } catch { /* file may already be gone */ }

    // Delete record from DB
    await File.delete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadFiles,
  getFileById,
  applyTemplate,
  batchApplyTemplate,
  downloadFile,
  deleteFile
};