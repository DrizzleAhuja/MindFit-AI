const User = require("../models/User");

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName } = req.body; // Removed role from here
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};



module.exports = { updateUser };
