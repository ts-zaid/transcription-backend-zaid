const express = require("express");
const {
  getAllExtensions,
  getExtensionById,
  createExtension,
  updateExtension,
  deleteExtension,
} = require("../controllers/extensionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CRUD Routes
router.get("/", authMiddleware, getAllExtensions);
router.get("/:id", authMiddleware, getExtensionById);
router.post("/", authMiddleware, createExtension);
router.put("/:id", authMiddleware, updateExtension);
router.delete("/:id", authMiddleware, deleteExtension);

module.exports = router;
