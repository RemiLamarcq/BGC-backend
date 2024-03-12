var express = require('express');
const mongoose = require('mongoose');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');
const GamePlays = require('../models/gamePlays');
const GamesPlays = require('../models/gamePlays');
const GamesPlay = require('../models/gamePlays');
require('../models/types');
const gamesPlayModel = mongoose.model('gamePlays');



const app = express();

// Ajout de la route GET Stat Generals

router.get('/getGeneralsStats/:token', async (req, res) => {
    let gamesNumber = '';
    let gamePlaysNumber = '';
    let responseResult = {};

    try {
        // Vérifiez d'abord si le token est valide
        const user = await User.findOne({ token: req.params.token });
        if (!user) {
            responseResult = { result: false, error: "Invalid token" };
        } else {
            // Aggregation 1 -> le jeu le plus présent dans la collection gameplay de cet UserId
            const result = await gamesPlayModel.aggregate([
                {
                    $match: { idUser: user._id }, // Filtrez par l'utilisateur actuel
                },
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

            if (result && result.length > 0) {
                responseResult = { result: true, mostCommonGame: result[0].mostCommonIdGame };
            } else {
                responseResult = { result: false, message: 'No records found or empty list.' };
            }

            // Aggregation 2 -> le nombre de jeux présents dans le closet du user
            gamesNumber = user.closet.length;

            // Aggregation 3 -> le nombre de parties totales du user
            const userGamePlays = await GamePlays.find({ idUser: user._id });
            gamePlaysNumber = userGamePlays.length;

            // Aggregation 4 -> tous les jeux du closet du user
            const userCloset = await user.populate({
                path: 'closet.idGame',
                populate: {
                    path: 'gameType',
                }
            });

            // Ajouter les autres résultats à responseResult si nécessaire
            responseResult.gamesNumber = gamesNumber;
            responseResult.gamePlaysNumber = gamePlaysNumber;
            responseResult.userCloset = userCloset.closet;
        }
    } catch (error) {
        console.error('Error:', error.message);
        responseResult = { result: false, error: 'Internal Server Error' };
    } finally {
        // Retour de la réponse à la fin de la fonction
        res.json(responseResult);
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

        // Récupérer le top 3 des meilleurs joueurs
        const topPlayers = await GamesPlay.aggregate([
            { $match: { idGame: gameInfo._id, 'players.isWinner': true } },
            { $unwind: '$players' },
            { $group: { _id: '$players.friendName', wins: { $sum: 1 } } },
            { $sort: { wins: -1 } },
            { $limit: 3 },
        ]);

        // Récupérer le nombre de parties
        const numberOfGames = await GamesPlay.countDocuments({ idGame: gameInfo._id });

        // Récupérer la durée moyenne d'une partie
        const averageDuration = await GamesPlay.aggregate([
            {
                $match: {
                    idGame: gameInfo._id,
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

        // Récupérer la date de la dernière partie
        const lastGameDate = await GamesPlay.findOne(
            { idGame: gameInfo._id },
            { endDate: 1 }
        ).sort({ endDate: -1 });

        res.json({
            result: true,
            gameInfo: {
                imageUrl: gameInfo.urlImg,
                name: gameInfo.name,
                topPlayers,
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

router.get('/friendStats/:token/:friendName', async (req, res) => {
    try {
        const userToken = req.params.token;
        const friendName = req.params.friendName;

        // Récupérer l'utilisateur correspondant au token
        const user = await User.findOne({ token: userToken });
        if (!user) {
            return res.status(404).json({ result: false, message: 'User not found' });
        }

        // Vérifier si l'ami existe dans la liste des amis de l'utilisateur
        if (!user.friendsName.includes(friendName)) {
            return res.status(404).json({ result: false, message: 'Friend not found in the user\'s friend list' });
        }

        // Récupérer les statistiques de l'ami
        const friendStats = await GamesPlay.aggregate([
            { $match: { 'players.friendName': friendName } },
            {
                $group: {
                    _id: null,
                    totalGames: { $sum: 1 },
                    totalWins: { $sum: { $cond: [{ $eq: ['$players.isWinner', true] }, 1, 0] } },
                    mostPlayedGame: { $first: '$idGame' },
                    lastGame: { $max: '$endDate' },
                },
            },
        ]);

        if (friendStats.length === 0) {
            return res.json({ result: false, message: 'No game plays found for the friend' });
        }

        // Récupérer le nom du jeu le plus joué
        const mostPlayedGameName = await Game.findById(friendStats[0].mostPlayedGame, 'name');

        res.json({
            result: true,
            friendStats: {
                totalGames: friendStats[0].totalGames,
                totalWins: friendStats[0].totalWins,
                mostPlayedGame: mostPlayedGameName ? mostPlayedGameName.name : null,
                lastGame: friendStats[0].lastGame,
            },
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ result: false, error: 'Internal Server Error' });
    }
});


module.exports = router;