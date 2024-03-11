const mongoose = require('mongoose');

const playersSchema = mongoose.Schema({
    friendName : String,
    isWinner : Boolean, 
    Team : String, 
    Character : String, 
    Score : String
   });


const gamesPlaySchema = mongoose.Schema({
  idGame: {type: mongoose.Schema.Types.ObjectId, ref: 'games'},
  idUser: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  startDate: Date,
  endDate: Date,
  players: [playersSchema], 
  urlImage : Array, 
  comment : String, 
  place : String, 
  isInterrupted : Boolean


});

const GamesPlay = mongoose.model('gamePlays', gamesPlaySchema);

module.exports = GamesPlay;
