// controllers/authController.js
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async (req, res) => {
  console.log('Login request received:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    body: req.body
  });

  // Check if required fields are present
  if (!req.body.token || !req.body.role) {
    console.error('Missing required fields:', req.body);
    return res.status(400).json({
      message: "Missing required fields: token and role are required"
    });
  }

  const { token, role } = req.body;

  try {
    const audienceEnv = process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID;

    if (!audienceEnv) {
      console.error('Google Client ID not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const audience = audienceEnv && audienceEnv.includes(",")
      ? audienceEnv.split(",").map((value) => value.trim()).filter(Boolean)
      : audienceEnv;

    console.log('Verifying Google token with audience:', audience);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience,
    });

    const {
      email,
      given_name: firstName,
      family_name: lastName,
    } = ticket.getPayload();

    console.log('Google token verified for email:', email);

    // Check for admin role and validate email
    if (role === "admin" && !["kumarprasadaman1234@gmail.com", "drizzle003.ace@gmail.com"].includes(email)) {
      console.error("Invalid admin email:", email);
      return res.status(400).json({ message: "Invalid admin email" });
    }

    // No restrictions for user role

    // Find or create the user
    let user = await User.findOne({ email });
    if (!user) {
      console.log('Creating new user:', email);
      user = new User({ firstName, lastName, email, role });
      await user.save();
    } else {
      console.log('Updating existing user:', email);
      user.role = role;
      await user.save();
    }

    console.log('Login successful for user:', email);
    res.status(200).json({ message: "Logged in successfully", user });
  } catch (error) {
    console.error("Error during login:", error);

    // More specific error messages
    if (error.message.includes('Invalid token')) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

module.exports = { login };
