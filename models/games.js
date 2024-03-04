const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
    name: String,
    urlImg: String,
    minPlayers: Number,
    maxPlayers: Number,
    duration: Number,
    gameType: [{type: mongoose.Schema.Types.ObjectId, ref: 'types'}],
    isTeam: Boolean,
    isScore: Boolean,
    isCharacter: Boolean,
});

const Game = mongoose.model('games', gameSchema);

module.exports = Game;