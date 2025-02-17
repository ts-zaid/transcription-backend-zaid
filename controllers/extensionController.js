const Extension = require("../models/extension");

// Get all extensions
exports.getAllExtensions = async (req, res) => {
  try {
    const extensions = await Extension.findAll();
    res.json(extensions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get extension by ID
exports.getExtensionById = async (req, res) => {
  try {
    const extension = await Extension.findByPk(req.params.id);
    if (!extension) return res.status(404).json({ error: "Extension not found" });

    res.json(extension);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new extension
exports.createExtension = async (req, res) => {
  try {
    const { number, extension } = req.body;

    const newExtension = await Extension.create({ number, extension });
    res.status(201).json(newExtension);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update an extension
exports.updateExtension = async (req, res) => {
  try {
    const { number, extension } = req.body;
    const ext = await Extension.findByPk(req.params.id);

    if (!ext) return res.status(404).json({ error: "Extension not found" });

    await ext.update({ number, extension });
    res.json(ext);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete an extension
exports.deleteExtension = async (req, res) => {
  try {
    const ext = await Extension.findByPk(req.params.id);
    if (!ext) return res.status(404).json({ error: "Extension not found" });

    await ext.destroy();
    res.json({ message: "Extension deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
