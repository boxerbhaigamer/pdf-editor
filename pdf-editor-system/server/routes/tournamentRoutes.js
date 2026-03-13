const express = require('express');
const {
  createTournament,
  getTournaments,
  getTournamentById,
  getFilesByTournament,
  updateTournament,
  deleteTournament
} = require('../controllers/tournamentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All tournament routes are protected
router.use(authMiddleware);

// Create a new tournament
router.post('/', createTournament);

// Get all tournaments
router.get('/', getTournaments);

// Get a tournament by ID
router.get('/:id', getTournamentById);

// Get files for a tournament
router.get('/:id/files', getFilesByTournament);

// Update a tournament
router.put('/:id', updateTournament);

// Delete a tournament
router.delete('/:id', deleteTournament);

module.exports = router;