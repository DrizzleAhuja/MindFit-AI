const Report = require("../models/Report");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");
const crypto = require("crypto");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const createReport = async (req, res) => {
  const {
    reportType,
    location,
    itemName,
    category,
    date,
    description,
    images,
  } = req.body;

  try {
    const uploadedImages = await Promise.all(
      images.map((image) =>
        cloudinary.uploader.upload(image, { folder: "lost-found" })
      )
    );
    const imageUrls = uploadedImages.map((result) => result.secure_url);

    const user = await User.findOne({ email: req.headers.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const reportID = await generateUniqueReportID();

    const newReport = new Report({
      reportID: reportID,
      reportType,
      location,
      itemName,
      category,
      date,
      description,
      images: imageUrls,
      user: user._id,
      verificationStatus: "Under Verification", // Initially, the report is under verification
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(500).json({ message: "Error creating report" });
  }
};

async function generateUniqueReportID() {
  let reportID;
  let idExists = true;

  while (idExists) {
    // Generate a random alphanumeric string of length 6
    reportID = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Check if the reportID already exists in the database
    const existingReport = await Report.findOne({ reportID });

    if (!existingReport) {
      idExists = false;
    }
  }

  return reportID;
}

const getReports = async (req, res) => {
  try {
    const query = {};

    // Check if the request is for claimed reports only
    if (req.query.claimed === "true") {
      query.claimedBy = { $exists: true, $ne: null };
    }

    if (req.query.reportID) {
      query.reportID = req.query.reportID;
    }

    const reports = await Report.find(query).populate("user", "email");
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error });
  }
};

const getReportsByUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.headers.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const reports = await Report.find({ user: user._id });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error });
  }
};

const editReport = async (req, res) => {
  const { id } = req.params;
  const { itemName, location, category, date, description, images } = req.body;

  try {
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const user = await User.findOne({ email: req.headers.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user.role === "admin" ||
      report.user.toString() === user._id.toString()
    ) {
      let imageUrls = report.images;

      if (images && images.length > 0) {
        const uploadedImages = await Promise.all(
          images.map((image) => {
            if (typeof image !== "string") {
              throw new Error("Invalid image format");
            }
            return cloudinary.uploader.upload(image, { folder: "lost-found" });
          })
        );

        imageUrls = uploadedImages.map((result) => result.secure_url);
      }

      report.itemName = itemName;
      report.location = location;
      report.category = category;
      report.date = date;
      report.description = description;
      report.images = imageUrls;

      const updatedReport = await report.save();
      res.status(200).json(updatedReport);
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error updating report" });
  }
};

const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const deletedReport = await Report.findByIdAndDelete(reportId);

    if (!deletedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// const claimReport = async (req, res) => {
//   const { id } = req.params;
//   const { email } = req.headers;

//   try {
//     const report = await Report.findById(id).populate("user");

//     if (!report) {
//       return res.status(404).json({ message: "Report not found" });
//     }

//     if (report.claimedBy) {
//       return res.status(400).json({ message: "Item already claimed" });
//     }

//     const claimingUser = await User.findOne({ email });

//     if (!claimingUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (report.user.email === claimingUser.email) {
//       return res.status(400).json({ message: "You can't claim your own item" });
//     }

//     const otp = await generateUniqueOTP();
//     report.claimedBy = claimingUser.email;
//     report.claimedAt = new Date();
//     report.read = false;
//     report.otp = otp;
//     report.verificationStatus = "Under Verification"; // Mark report as verified upon successful claim

//     if (report.reportType === "found" || "lost") {
//       report.responseMessage =
//         "You can claim your item from the security room.";
//     }

//     const updatedReport = await report.save();

//     let mailOptions;
//     if (report.reportType === "lost") {
//       mailOptions = {
//         from: process.env.MAIL_USER,
//         to: report.user.email,
//         subject: "Your Lost Item has been Claimed",
//         text: `Hello ${report.user.firstName},\n\nYour lost item "${report.itemName
//           }" has been claimed by ${claimingUser.firstName} ${claimingUser.lastName ? claimingUser.lastName : ""
//           }
//  (Email: ${claimingUser.email
//           }).\n\nPlease contact the security office to retrieve your item. Use the following OTP for verification: ${otp}.\n\nBest regards,\nYour Lost and Found Team`,
//       };
//     } else if (report.reportType === "found") {
//       mailOptions = {
//         from: process.env.MAIL_USER,
//         to: claimingUser.email,
//         subject: "Your Found Item has been Located",
//         text: `Dear ${claimingUser.firstName},\n\nYour item "${report.itemName
//           }" has been found by ${report.user.firstName} ${report.user.lastName ? report.user.lastName : ""
//           }
//  (Email: ${report.user.email
//           }).\n\nPlease contact the security office to retrieve your item. Use the following OTP for verification: ${otp}.\n\nBest regards,\nYour Lost and Found Team`,
//       };
//     }

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error("Error sending email:", error);
//       } else {
//         console.log("Email sent:", info.response);
//       }
//     });

//     res.status(200).json(updatedReport);
//   } catch (error) {
//     res.status(500).json({ message: "Error claiming report", error });
//   }
// };
const claimReport = async (req, res) => {
  const { id } = req.params;
  const { email } = req.headers;
  const { proofDescription } = req.body;

  try {
    const report = await Report.findById(id).populate("user");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.claimedBy) {
      return res.status(400).json({ message: "Item already claimed" });
    }

    const claimingUser = await User.findOne({ email });

    if (!claimingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (report.user.email === claimingUser.email) {
      return res.status(400).json({ message: "You can't claim your own item" });
    }

    report.claimedBy = claimingUser.email;
    report.claimedAt = new Date();
    report.read = false;
    report.verificationStatus = "Under Verification";

    if (report.reportType === "found") {
      report.proofDescription = proofDescription;

      report.responseMessage =
        "Please come to the security office with a detailed description of your proof for further verification and to claim your item within 2 days otherwise your claim will be rejected.";
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: claimingUser.email,
        subject: "Item Claim Verification",
        text: `Hello ${report.user.firstName},\n\nYou have claimed this item named as "${report.itemName}".\n\nPlease come to the security office with a detailed description of your proof for further verification and to claim your item within 2 days otherwise your claim will be rejected.\n\nBest regards,\nYour Lost and Found Team`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      }); 

      // Timeout to reset claim information if not verified for found reports
      setTimeout(async () => {
        const reportToUpdate = await Report.findById(id);
        if (reportToUpdate.verificationStatus !== "Verified") {
          reportToUpdate.claimedBy = "";
          reportToUpdate.claimedAt = null;
          reportToUpdate.proofDescription = "";

          await reportToUpdate.save();

          // Send rejection email to the user who claimed the item
          const mailOptions = {
            from: process.env.MAIL_USER,
            to: claimingUser.email,
            subject: "Claim Rejected: Verification Not Completed",
            text: `Dear ${claimingUser.firstName},\n\nYour claim for the report ID: ${id} has been rejected as you did not appear for verification at the security office within the required time frame.\n\nPlease contact us if you need further assistance.\n\nBest regards,\nYour Lost and Found Team`,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Error sending rejection email:", error);
            } else {
              console.log("Rejection email sent:", info.response);
            }
          });

          console.log(
            `Claim information reset for report ID: ${id} due to timeout`
          );
        }
      }, 2 * 24 * 60 * 60 * 1000); // 2 days in milliseconds
    } else if (report.reportType === "lost") {
      const otp = await generateUniqueOTP();
      report.otp = otp;

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: report.user.email,
        subject: "Your Lost Item has been Claimed",
        text: `Hello ${report.user.firstName},\n\nYour lost item "${
          report.itemName
        }" has been claimed by ${claimingUser.firstName} ${
          claimingUser.lastName ? claimingUser.lastName : ""
        } (Email: ${
          claimingUser.email
        }).\n\nPlease contact the security office to retrieve your item. Use the following OTP for verification: ${otp}.\n\nBest regards,\nYour Lost and Found Team`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }

    const updatedReport = await report.save();

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error claiming report:", error);
    res.status(500).json({ message: "Error claiming report", error: error.message });
  }
};

const verifyReport = async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  try {
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.otp === otp) {
      report.verificationStatus = "Verified";
      await report.save();
      res.status(200).json({ message: "Report successfully verified" });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying report", error });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Marking notification as read for report id: ${id}`);
    const report = await Report.findById(id);

    if (!report) {
      console.error("Report not found");
      return res.status(404).json({ message: "Report not found" });
    }

    report.read = true;
    await report.save();

    console.log("Notification marked as read");
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

async function generateUniqueOTP() {
  let otp;
  let otpExists = true;

  while (otpExists) {
    otp = crypto.randomInt(100000, 999999).toString();
    const existingReport = await Report.findOne({ otp });

    if (!existingReport) {
      otpExists = false;
    }
  }

  return otp;
}
const resetReport = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Update the fields to be reset
    report.claimedBy = "";
    report.claimedAt = "";

    const updatedReport = await report.save();
    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error resetting report:", error);
    res.status(500).json({ message: "Error resetting report" });
  }
};

const sendOTPtoFound = async (req, res) => {
  const { id } = req.params; // Report ID

  try {
    // Find the report by ID and populate the user who created the report
    const report = await Report.findById(id).populate("user");
    console.log("Report found:", report);

    if (!report) {
      console.log("Report not found");
      return res.status(404).json({ message: "Report not found" });
    }

    if (!report.claimedBy) {
      console.log("Report has not been claimed yet");
      return res
        .status(400)
        .json({ message: "Report has not been claimed yet" });
    }

    // Find the user who claimed the report
    const claimingUser = await User.findOne({ email: report.claimedBy });
    console.log("Claiming user found:", claimingUser);

    if (!claimingUser) {
      console.log("Claiming user not found");
      return res.status(404).json({ message: "Claiming user not found" });
    }

    // Generate OTP and update the report's OTP field
    const otp = await generateUniqueOTP();
    report.otp = otp;
    await report.save();
    console.log("OTP generated and saved:", otp);

    // Prepare email to send OTP to the claiming user
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: claimingUser.email, // Send the OTP to the claimedBy user's email
      subject: "Your Claimed Item Verification OTP",
      text: `Dear ${claimingUser.firstName},\n\nYour claimed item "${report.itemName}" requires verification. Please use the following OTP to verify your claim: ${otp}.\n\nBest regards,\nYour Lost and Found Team`,
    };
    console.log("Mail options prepared:", mailOptions);

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending OTP email" });
      } else {
        console.log("Email sent successfully:", info.response);
        return res
          .status(200)
          .json({ message: "OTP sent successfully to the claiming user" });
      }
    });
  } catch (error) {
    console.error("Error in sending OTP:", error);
    return res.status(500).json({ message: "Error in sending OTP" });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportsByUser,
  editReport,
  deleteReport,
  claimReport,
  verifyReport,
  markNotificationAsRead,
  resetReport,
  sendOTPtoFound,
};
