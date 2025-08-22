const BMI = require("../models/BMI");
const User = require("../models/User");

exports.saveBMI = async (req, res) => {
  try {
    const { email, bmi, category } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newBMI = new BMI({ userId: user._id, bmi, category });
    await newBMI.save();

    res.status(201).json({ message: "BMI saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getBMIHistory = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const history = await BMI.find({ userId: user._id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
