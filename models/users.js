const mongoose = require('mongoose');

const closetSchema = mongoose.Schema({
idGame: {type: mongoose.Schema.Types.ObjectId, ref: 'games'},
personalNote: Number,
});

const notePadSchema = mongoose.Schema({
title: String,
content: Number,
});

const usersSchema = mongoose.Schema({
email: String,
username: String,
password: String,
token: String,
closet: [closetSchema],
friendsName : Array,
notePad : [notePadSchema],


});

const User = mongoose.model('users', usersSchema);

module.exports = User;