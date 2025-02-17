const twilio = require("twilio");
const moment = require("moment");
const Call = require("../models/call");
const Extension = require("../models/extension");

require("dotenv").config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * 1️⃣ Handle Incoming Call: Prompt user for extension input
 */
exports.incomingCall = (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Welcome! Please enter your extension followed by the pound key.");
  twiml.gather({
    numDigits: 3,
    action: `${process.env.SERVER_URL}/api/calls/handle-extension`,
    method: "POST",
  });

  res.type("text/xml").send(twiml.toString());
};

/**
 * 2️⃣ Handle Extension Input: Look up extension, forward the call, and start recording
 */
exports.handleExtension = async (req, res) => {
  try {
    const { Digits, From, CallSid } = req.body;
    if (!Digits) return res.status(400).send("Extension input is missing.");

    const extension = await Extension.findOne({ where: { extension: Digits } });
    const twiml = new twilio.twiml.VoiceResponse();

    if (!extension) {
      twiml.say("Invalid extension. Please try again.");
      twiml.gather({
        numDigits: 3,
        action: `${process.env.SERVER_URL}/api/calls/handle-extension`,
        method: "POST",
      });
      return res.type("text/xml").send(twiml.toString());
    }

    twiml.say(`Connecting you to extension ${Digits}.`);
    twiml.dial(
      {
        record: "record-from-answer",
        action: `${process.env.SERVER_URL}/api/calls/recording`, // Handle recording callback
        // statusCallback: `${process.env.SERVER_URL}/api/calls/status-update`, // Handle call completion
        statusCallbackEvent: ["completed"], // Handle more scenarios
        method: "POST",
      },
      extension.number
    );

    // Save call details
    await Call.create({ 
      from: From, 
      to: extension.number, 
      extension: Digits, 
      status: "ongoing", // Set initial status
      callSid: CallSid 
    });

    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Error handling extension:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


/**
 * 3️⃣ Handle Recording Callback: Save recording URL to the database
 */
exports.saveRecording = async (req, res) => {
  try {
    const { CallSid, RecordingUrl } = req.body;

    console.log('Recording data', req.body)
    const twiml = new twilio.twiml.VoiceResponse();

    if (!CallSid || !RecordingUrl) return res.status(400).json({ error: "Invalid recording data." });

    await Call.update({status: "completed", recordingUrl: RecordingUrl }, { where: { callSid: CallSid } });
    // twiml.say("");
    return res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Error saving recording:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * 4️⃣ Fetch Call Logs: Retrieve all call logs from the database
 */
exports.getCallLogs = async (req, res) => {
  try {
    const calls = await Call.findAll();
    res.json(calls);
  } catch (error) {
    console.error("Error fetching call logs:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * 6️⃣ Handle Call Completion: Update call status when the call ends
 */
exports.callStatusUpdate = async (req, res) => {
  try {
    const { CallSid, CallStatus } = req.body;

    if (!CallSid) return res.status(400).json({ error: "CallSid is missing." });

    // Update call status in the database
    await Call.update(
      { status: CallStatus || "completed" },
      { where: { callSid: CallSid } }
    );

    console.log(`✅ Call ${CallSid} status updated to: ${CallStatus}`);
    res.json({ success: true, message: "Call status updated." });
  } catch (error) {
    console.error("❌ Error updating call status:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


/**
 * 5️⃣ Fetch All Recordings: Retrieve call recordings with optional date filters
 */
exports.getAllRecordings = async (req, res) => {
  try {
    // 🔹 Query Parameters from Request
    const { date, dateAfter, dateBefore, page, pageSize } = req.query;

    // 🔹 Filters Setup
    let filters = {
      limit: pageSize ? parseInt(pageSize) : 10, // Default 10 recordings per page
      page: page ? parseInt(page) : 0, // Default first page
    };

    // ✅ **Specific Date Filter (Single Day)**
    if (date) {
      filters.dateCreatedAfter = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
      filters.dateCreatedBefore = new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        .toISOString()
        .split("T")[0]; // Next Day
    }

    // ✅ **Date Range Filter (Between Two Dates)**
    if (dateAfter) filters.dateCreatedAfter = new Date(dateAfter).toISOString().split("T")[0];
    if (dateBefore) filters.dateCreatedBefore = new Date(dateBefore).toISOString().split("T")[0];

    // 🔹 Fetch Total Recordings for Pagination (to calculate total pages)
    const totalRecordings = await client.recordings.list({
      ...filters,
      limit: undefined, // Fetch all recordings without the limit for total count
    });

    // 🔹 Fetch Recordings with Filters
    const recordings = await client.recordings.list(filters);

    // 🔹 Fetch Call Details for Each Recording
    const enrichedRecordings = await Promise.all(
      recordings.map(async (recording) => {
        const call = await Call.findOne({ where: { callSid: recording.callSid } });
        return {
          sid: recording.sid,
          callSid: recording.callSid,
          dateCreated: recording.dateCreated,
          duration: recording.duration,
          status: recording.status,
          recordingUrl: `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`,
          from: call ? call.from : "Unknown",
          to: call ? call.to : "Unknown",
          createdAt: call ? call.createdAt : "Unknown",
        };
      })
    );

    // 🔹 Calculate Total Pages
    const totalPages = Math.ceil(totalRecordings.length / filters.limit);

    // 🔹 Pagination Setup (Next Page Logic)
    const nextPage = recordings.length === filters.limit ? parseInt(filters.page) + 1 : null;

    res.json({
      success: true,
      message: "Filtered Recordings List",
      page: filters.page,
      pageSize: filters.limit,
      nextPage: nextPage,
      totalPages: totalPages,
      recordings: enrichedRecordings,
    });
  } catch (error) {
    console.error("❌ Error fetching recordings:", error);
    res.status(500).json({ success: false, message: "Error fetching recordings", error: error.message });
  }
};



// 📊 Fetch Audio Stats from Twilio Recordings
exports.getAudioStats = async (req, res) => {
  try {
    // Fetch all recordings from Twilio (limit 1000 for performance)
    const recordings = await client.recordings.list({ limit: 1000 });

    // Get date ranges
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "days").startOf("day");
    const last7Days = moment().subtract(7, "days").startOf("day");
    const last30Days = moment().subtract(30, "days").startOf("day");

    // Filter recordings based on creation date
    const todayCount = recordings.filter(rec => moment(rec.dateCreated).isSameOrAfter(today)).length;
    const yesterdayCount = recordings.filter(rec => 
      moment(rec.dateCreated).isBetween(yesterday, today, null, "[)")
    ).length;
    const last7DaysCount = recordings.filter(rec => moment(rec.dateCreated).isSameOrAfter(last7Days)).length;
    const last30DaysCount = recordings.filter(rec => moment(rec.dateCreated).isSameOrAfter(last30Days)).length;

    res.json({
      success: true,
      message: "Stats List",
      data: {
        audio_received_today: todayCount,
        audio_received_yesterday: yesterdayCount,
        audio_received_last_7_days: last7DaysCount,
        audio_received_last_30_days: last30DaysCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

