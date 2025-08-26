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

// ✅ CORS config (production frontend only)
app.use(
  cors({
    origin: "https://mindfitai.vercel.app", // 👈 frontend domain
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // 👈 allow cookies/sessions
  })
);

// ✅ Preflight OPTIONS request
app.options("*", cors());

// ✅ Extra CORS headers (for Vercel strict checks)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://mindfitai.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
