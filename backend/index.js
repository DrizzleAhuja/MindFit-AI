const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");
const bmiRoutes = require("./routes/bmiRoutes");
// const messageRoutes = require("./routes/messageRoutes");

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ✅ CORS config (production + localhost) with proper preflight handling
const allowedOrigins = [
  "https://mindfitai.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server or curl (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ Explicitly handle preflight with same options
app.options("*", cors(corsOptions));

// ✅ Extra CORS headers (for platforms with strict proxying)
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
  );

  // Short-circuit preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// ✅ Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// ✅ MongoDB connect
const mongoUrl = process.env.MONGODB_URL;
const mongoDbName = process.env.MONGODB_DB;

mongoose
  .connect(mongoUrl, mongoDbName ? { dbName: mongoDbName } : undefined)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bmi", bmiRoutes);
// app.use("/api", messageRoutes);

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).send({
    status: "error",
    message: "Internal Server Error",
  });
});

// ✅ Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
