const Tournament = require('../models/Tournament');
const File = require('../models/File');
const { createTournamentFolders } = require('../utils/googleDrive');

// Create a new tournament
const createTournament = async (req, res) => {
  try {
    const { name } = req.body;
    const createdBy = req.user.id;

    let gdriveFolderId = null;
    let gdriveOriginalFolderId = null;
    let gdriveEditedFolderId = null;

    if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_REFRESH_TOKEN && process.env.GOOGLE_DRIVE_FOLDER_ID) {
      try {
        const folders = await createTournamentFolders(name, process.env.GOOGLE_DRIVE_FOLDER_ID);
        gdriveFolderId = folders.mainFolderId;
        gdriveOriginalFolderId = folders.originalFolderId;
        gdriveEditedFolderId = folders.editedFolderId;
      } catch (driveErr) {
        console.error('Failed to create Google Drive folders for tournament:', driveErr);
        // We continue tournament creation even if drive folder creation fails
      }
    }

    const tournament = await Tournament.create({ 
      name, 
      createdBy,
      gdriveFolderId,
      gdriveOriginalFolderId,
      gdriveEditedFolderId
    });
    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all tournaments
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.findAll();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a tournament by ID
const getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get files for a tournament
const getFilesByTournament = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify tournament exists
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const files = await File.findAllByTournamentId(id);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a tournament
const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const tournament = await Tournament.update(id, { name });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a tournament
const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.delete(id);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTournament,
  getTournaments,
  getTournamentById,
  getFilesByTournament,
  updateTournament,
  deleteTournament
};