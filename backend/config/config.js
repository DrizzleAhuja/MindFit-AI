const config = {
  development: {
    API_BASE_URL: "http://localhost:8000",
    NODE_ENV: "development",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "your-gemini-api-key",
    GEMINI_API_URL:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  },
  production: {
    API_BASE_URL:
      process.env.API_BASE_URL ||
      process.env.VERCEL_URL ||
      "https://your-production-domain.com",
    NODE_ENV: "production",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "your-gemini-api-key",
    GEMINI_API_URL:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  },
};

const environment = process.env.NODE_ENV || "development";

// Function to get the current URL for production
const getCurrentUrl = (req) => {
  if (environment === "production") {
    return `${req.protocol}://${req.get("host")}`;
  }
  return config[environment].API_BASE_URL;
};

module.exports = {
  ...config[environment],
  environment,
  getCurrentUrl,
};
