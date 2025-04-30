const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    seen: { type: Boolean, default: false },
    profile: {type: String, default: ''},
    
},{timestamps: true})

const MessageModel = mongoose.model('Message',MessageSchema);

module.exports = MessageModel;
