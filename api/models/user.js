const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    username: {type:String, unique:true},
    password: String,
    profilePic: {type: String, default:null},

},{timestamps: true});

const UserModel = mongoose.model('User',UserSchema);

module.exports = UserModel;