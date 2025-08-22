const User = require("../models/User");
const authMiddleware = async (req, res, next) => {
  const email = req.headers.email;

  console.log("Received email:", email); // Debugging line

  if (!email) {
    return res.status(401).json({ message: "Unauthorized: No email provided" });
  }

  try {
    const user = await User.findOne({ email });
    console.log("Found user:", user); // Debugging line

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error authenticating user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = authMiddleware;