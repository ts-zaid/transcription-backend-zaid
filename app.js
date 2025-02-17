const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const extensionRoutes = require("./routes/extensionRoutes");
const callRoutes = require("./routes/callRoutes");
const User = require("./models/user");
const Extension = require("./models/extension"); // Import Extension Model
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// Default Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/extensions", extensionRoutes);
app.use("/api/calls", callRoutes); // Add Call Routes

// Sync Database
sequelize.sync().then(() => console.log("Database synced"));

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
