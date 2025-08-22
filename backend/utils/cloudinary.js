const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

module.exports = cloudinary;
// # MAIL_PASS=jpjz bgry fmop fudd
// # MAIL_USER=study.drizzle@gmail.com