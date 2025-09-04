const User = require("../models/User");

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName },
      { new: true, runValidators: true }
    );

    console.log("User updated successfully:", user);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

module.exports = { updateUser };
