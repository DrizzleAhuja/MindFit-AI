const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    rollNo: {
        type: String,
        required: true,
    },
    email: {
        type: String
    },
    item: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fakeClaim: {
        type: Boolean,
        default: false,
    },
    reportId: {
        type: String,
        default: "", // Optional field
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
