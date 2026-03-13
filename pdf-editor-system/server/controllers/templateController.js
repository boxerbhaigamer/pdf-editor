const Template = require('../models/Template');
const fs = require('fs').promises;
const path = require('path');

// Create uploads directory for logos
const ensureLogoDir = async () => {
  const logoDir = path.join(__dirname, '..', 'uploads', 'logos');
  try {
    await fs.access(logoDir);
  } catch {
    await fs.mkdir(logoDir, { recursive: true });
  }
  return logoDir;
};

// Create a new template
const createTemplate = async (req, res) => {
  try {
    const { name, title, subtitle, venue, dates, leftLogoBase64, rightLogoBase64 } = req.body;

    let leftLogoUrl = null;
    let rightLogoUrl = null;

    // Handle base64 logo uploads
    if (leftLogoBase64) {
      const logoDir = await ensureLogoDir();
      const fileName = `left_logo_${Date.now()}.png`;
      const filePath = path.join(logoDir, fileName);
      const base64Data = leftLogoBase64.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(filePath, base64Data, 'base64');
      leftLogoUrl = `/uploads/logos/${fileName}`;
    }

    if (rightLogoBase64) {
      const logoDir = await ensureLogoDir();
      const fileName = `right_logo_${Date.now()}.png`;
      const filePath = path.join(logoDir, fileName);
      const base64Data = rightLogoBase64.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(filePath, base64Data, 'base64');
      rightLogoUrl = `/uploads/logos/${fileName}`;
    }

    const template = await Template.create({
      name,
      title,
      subtitle,
      venue,
      dates,
      leftLogoUrl: leftLogoUrl || req.body.leftLogoUrl || null,
      rightLogoUrl: rightLogoUrl || req.body.rightLogoUrl || null
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all templates
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, subtitle, venue, dates, leftLogoBase64, rightLogoBase64 } = req.body;

    let leftLogoUrl = req.body.leftLogoUrl || req.body.left_logo_url || null;
    let rightLogoUrl = req.body.rightLogoUrl || req.body.right_logo_url || null;

    // Handle base64 logo uploads
    if (leftLogoBase64) {
      const logoDir = await ensureLogoDir();
      const fileName = `left_logo_${Date.now()}.png`;
      const filePath = path.join(logoDir, fileName);
      const base64Data = leftLogoBase64.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(filePath, base64Data, 'base64');
      leftLogoUrl = `/uploads/logos/${fileName}`;
    }

    if (rightLogoBase64) {
      const logoDir = await ensureLogoDir();
      const fileName = `right_logo_${Date.now()}.png`;
      const filePath = path.join(logoDir, fileName);
      const base64Data = rightLogoBase64.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(filePath, base64Data, 'base64');
      rightLogoUrl = `/uploads/logos/${fileName}`;
    }

    const template = await Template.update(id, {
      name,
      title,
      subtitle,
      venue,
      dates,
      leftLogoUrl,
      rightLogoUrl
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.delete(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
};