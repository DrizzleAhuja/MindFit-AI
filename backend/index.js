const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");
const bmiRoutes = require("./routes/bmiRoutes"); // Import log routes
const messageRoutes = require('./routes/messageRoutes')
const logRoutes = require('./routes/logRoutes');

const app = express();

// CORS middleware - must come before all other middleware
app.use((req, res, next) => {
  console.log(`\n=== REQUEST RECEIVED ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Origin: ${req.headers.origin}`);
  console.log(`User-Agent: ${req.headers['user-agent']}`);
  console.log(`All Headers:`, req.headers);

  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', 'https://mindfitai.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('=== PREFLIGHT REQUEST HANDLED ===');
    console.log('Preflight request received:', req.method, req.url);
    console.log('Preflight headers:', req.headers);

    // Send 200 status for preflight
    res.status(200).end();
    return;
  }

  console.log('=== REQUEST CONTINUING ===');
  next();
});

// Express middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: 'none',
      httpOnly: true
    },
  })
);

const mongoUrl = process.env.MONGODB_URL;
const mongoDbName = process.env.MONGODB_DB;

mongoose
  .connect(mongoUrl, mongoDbName ? { dbName: mongoDbName } : undefined)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Test endpoint to verify CORS
app.get('/api/test-cors', (req, res) => {
  console.log('=== TEST CORS ENDPOINT HIT ===');
  console.log('Test CORS endpoint hit:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin
  });

  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bmi", bmiRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/messages", messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("=== SERVER ERROR ===");
  console.error("Server Error:", err.stack);
  res.status(500).send({
    status: "error",
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
