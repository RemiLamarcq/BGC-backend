var express = require('express');
const mongoose = require('mongoose');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');
const GamePlays = require('../models/gamePlays');
require('../models/types');
const gamesPlayModel = mongoose.model('gamePlays');



const app = express();

// Ajout de la route GET Stat Generals

router.get('/getGeneralsStats/:token', async (req, res) => {
    let gamesNumber = ''
    let gamePlaysNumber = ''
    try {
        // Vérifiez d'abord si le token est valide
        const user = await User.findOne({ token: req.params.token });
        if (!user) {
            return res.json({ result: false, error: "Invalid token" });
        }

        // Aggregation 1 -> le jeu le plus présent dans la colletion gameplay de cet UserId
        const result = await gamesPlayModel.aggregate([
            {
                $group: {
                    _id: '$idGame',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 1,
            },
            {
                $lookup: {
                    from: 'games', // Le nom de la collection des jeux
                    localField: '_id',
                    foreignField: '_id',
                    as: 'gameInfo',
                },
            },
            {
                $unwind: '$gameInfo',
            },
            {
                $project: {
                    mostCommonIdGame: '$gameInfo.name', // Utilisez le champ approprié du jeu que vous souhaitez afficher
                    count: 1, // Conservez les autres champs si nécessaire
                },
            },
        ]);

        if (result.length > 0) {
            //res.json({ result: true, mostCommonGame: result[0] });
        } else {
            res.json({ result: false, message: 'No records found.' });
        }

        // Aggregation 2 -> le nombre de jeux présents dans le closet du user
         
        const gamesNumber = user.closet.length;

        // Aggregation 3 -> le nombre de parties totales du user

        const userGamePlays = await GamePlays.find({ idUser: user._id });
        gamePlaysNumber = userGamePlays.length;

        // Retour de la réponse des 3 Aggregation 
        res.json({result : true, mostCommonGame: result[0].mostCommonIdGame, gamesNumber, gamePlaysNumber })
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ result: false, error: 'Internal Server Error' });
    }
});

// Stats par jeu 

router.get('/gameInfo/:gameName/:token', async (req, res) => {
    try {
      const gameName = req.params.gameName;
      const userToken = req.params.token;
  
      // Récupérer l'utilisateur correspondant au token
      const user = await User.findOne({ token: userToken });
      if (!user) {
        return res.status(404).json({ result: false, message: 'User not found' });
      }
  
      // Récupérer les informations du jeu
      const gameInfo = await Game.findOne({ name: gameName });
      if (!gameInfo) {
        return res.status(404).json({ result: false, message: 'Game not found' });
      }
  
      // Récupérer les 3 meilleurs joueurs de cet utilisateur pour ce jeu
      const topPlayers = await GamePlays.aggregate([
        { $match: { idGame: gameInfo._id, 'players.friendName': { $eq: user.friendName } } },
        { $unwind: '$players' },
        { $sort: { 'players.Score': -1 } },
        { $limit: 3 },
        { $group: { _id: null, players: { $push: '$players' } } },
        { $project: { _id: 0, players: 1 } },
      ]);
  
      // Récupérer le nombre de parties jouées par cet utilisateur pour ce jeu
      const numberOfGames = await GamePlays.countDocuments({
        idGame: gameInfo._id,
        'players.friendName': { $eq: user.friendName },
      });
  
      // Récupérer la durée moyenne d'une partie pour cet utilisateur et ce jeu
      const averageDuration = await GamePlays.aggregate([
        {
          $match: {
            idGame: gameInfo._id,
            'players.friendName': { $eq: user.friendName },
            startDate: { $exists: true },
            endDate: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            averageDuration: { $avg: { $subtract: ['$endDate', '$startDate'] } },
          },
        },
        { $project: { _id: 0, averageDuration: 1 } },
      ]);
  
      // Récupérer la date de la dernière partie pour cet utilisateur et ce jeu
      const lastGameDate = await GamePlays.findOne(
        { idGame: gameInfo._id, 'players.friendName': { $eq: user.friendName } },
        { endDate: 1 }
      ).sort({ endDate: -1 });
  
      res.json({
        result: true,
        gameInfo: {
          imageUrl: gameInfo.urlImg,
          name: gameInfo.name,
          topPlayers: topPlayers.length > 0 ? topPlayers[0].players : [],
          numberOfGames,
          averageDuration: averageDuration.length > 0 ? averageDuration[0].averageDuration : 0,
          lastGameDate: lastGameDate ? lastGameDate.endDate : null,
        },
      });
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ result: false, error: 'Internal Server Error' });
    }
  });

module.exports = router;