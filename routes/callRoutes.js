const express = require("express");
const {
  incomingCall,
  handleExtension,
  saveRecording,
  getCallLogs,
  getAllRecordings,
  getAudioStats,
  callStatusUpdate
} = require("../controllers/callController");

const router = express.Router();

router.post("/incoming", incomingCall);
router.post("/handle-extension", handleExtension);
router.post("/recording", saveRecording);
router.post("/status-update", callStatusUpdate);
router.get("/logs", getCallLogs);
router.get("/get-recording", getAllRecordings);
router.get("/audio-stats", getAudioStats);

module.exports = router;
