// routes/userRoutes.js
const express = require("express");
const { updateUser, deleteUser } = require("../controllers/userController");
const router = express.Router();

router.put("/:id", updateUser);


module.exports = router;
