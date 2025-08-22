// const Message = require("../models/Message");
// const nodemailer = require("nodemailer");

// const sendMessage = async (req, res) => {
//     const { name, rollNo, email, item, description, fakeClaim, reportId } = req.body;
//     const userId = req.user._id;

//     try {
//         // Save the message to the database
//         const newMessage = new Message({
//             name,
//             rollNo,
//             email,
//             item,
//             description,
//             user: userId,
//             fakeClaim,
//             reportId,
//         });
//         await newMessage.save();

//         // Create the transporter for nodemailer
//         const transporter = nodemailer.createTransport({
//             host: process.env.MAIL_HOST,
//             port: 587,
//             secure: false,
//             auth: {
//                 user: process.env.MAIL_USER,
//                 pass: process.env.MAIL_PASS,
//             },
//         });

//         // Email options for the admin
//         const adminMailOptions = {
//             from: email,
//             to: "drizzle003.ace@gmail.com",
//             subject: `Message from ${name} (Roll No: ${rollNo})`,
//             text: `Item: ${item}\nDescription: ${description}\n\nFrom: ${email}${fakeClaim ? '\n\n* Fake Claim' : ''}\nReport ID: ${reportId || 'N/A'}`,
//         };

//         // Email options for the user
//         const userMailOptions = {
//             from: "drizzle003.ace@gmail.com",
//             to: email,
//             subject: "Thank You for Contacting Us",
//             text: `Dear ${name},\n\nThank you for reaching out to us. We have received the following details from you:\n\nItem: ${item}\nDescription: ${description}\n\nYour report ID is: ${reportId || 'N/A'}\n\nPlease visit the security office for reporting the issue.\n\nBest regards,\nThe Team`,
//         };

//         // Send the emails
//         await transporter.sendMail(adminMailOptions);
//         await transporter.sendMail(userMailOptions);

//         res.status(200).json({ message: "Message sent successfully!" });
//     } catch (error) {
//         console.error("Error sending message:", error);  // Log the error
//         res.status(500).json({ error: "Failed to send message" });
//     }
// };

// module.exports = {
//     sendMessage,
// };


// module.exports = {
//     sendMessage,
// };
