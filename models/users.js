const mongoose = require('mongoose');

const closetSchema = mongoose.Schema({//sous document
    idGame: {type: mongoose.Schema.Types.ObjectId, ref: 'games'},
    personalNote: Number,
   });

const notePadSchema = mongoose.Schema({//sous document
    title: String,
    content: String,
   });

const userSchema = mongoose.Schema({
  email: String,
  username: String,
  password: String,
  token: String,
  closet: [closetSchema],//sous document
  friendsName : Array, 
  notePad : [notePadSchema],//sous document


});

const User = mongoose.model('users', userSchema);

module.exports = User;
