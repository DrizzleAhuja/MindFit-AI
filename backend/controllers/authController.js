// controllers/authController.js
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.login = async (req, res) => {
  const { token, role } = req.body; // Accept role in the request body

  try {
    const audienceEnv = process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID;
    const audience = audienceEnv && audienceEnv.includes(",")
      ? audienceEnv.split(",").map((value) => value.trim()).filter(Boolean)
      : audienceEnv;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience,
    });
    const {
      email,
      given_name: firstName,
      family_name: lastName,
    } = ticket.getPayload();

    // Check for admin role and validate email
    if (role === "admin" && !["kumarprasadaman1234@gmail.com", "drizzle003.ace@gmail.com"].includes(email)) {
      console.error("Invalid admin email:", email);
      return res.status(400).json({ message: "Invalid admin email" });
    }

    // No restrictions for user role

    // Find or create the user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ firstName, lastName, email, role });
      await user.save();
    } else {
      user.role = role;
      await user.save();
    }

    res.status(200).json({ message: "Logged in successfully", user });
  } catch (error) {
    console.error("Login error:", error); // Add this for debugging
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
