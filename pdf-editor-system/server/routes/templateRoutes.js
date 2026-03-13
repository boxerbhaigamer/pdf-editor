const express = require('express');
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All template routes are protected
router.use(authMiddleware);

// Create a new template
router.post('/', createTemplate);

// Get all templates
router.get('/', getTemplates);

// Get a template by ID
router.get('/:id', getTemplateById);

// Update a template
router.put('/:id', updateTemplate);

// Delete a template
router.delete('/:id', deleteTemplate);

module.exports = router;