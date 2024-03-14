var express = require('express');
const mongoose = require('mongoose');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');
const GamePlays = require('../models/gamePlays');
const GamesPlays = require('../models/gamePlays');
const GamesPlay = require('../models/gamePlays');
const Type = require('../models/types');
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

        // Récupérer les jeux du user
        const userGames = await Game.find({ userId: user._id });

        const gameInfos = [];

        // Pour chaque jeu du user, récupérer les informations
        for (const game of userGames) {
            const gameInfo = await Game.findOne({ name: game.name });
            if (!gameInfo) {
                console.log(`Game "${game.name}" not found`);
                continue; // Passer au jeu suivant si aucune information n'est trouvée
            }

            // Récupérer les parties du user pour ce jeu
            const userGamePlays = await GamesPlay.find({ idGame: gameInfo._id, idUser: user._id });

            // Récupérer le top 3 des meilleurs joueurs pour ce jeu
            const topPlayers = userGamePlays
                .filter(play => play.players.isWinner)
                .reduce((acc, play) => {
                    play.players.forEach(player => {
                        if (player.isWinner) {
                            acc[player.friendName] = (acc[player.friendName] || 0) + 1;
                        }
                    });
                    return acc;
                }, {});
            const sortedTopPlayers = Object.entries(topPlayers)
                .sort(([,winsA], [,winsB]) => winsB - winsA)
                .slice(0, 3);

            // Récupérer le nombre de parties
            const numberOfGames = userGamePlays.length;

            // Récupérer la durée moyenne d'une partie
            const totalDuration = userGamePlays.reduce((acc, play) => {
                if (play.startDate && play.endDate) {
                    acc += play.endDate - play.startDate;
                }
                return acc;
            }, 0);
            const averageDuration = totalDuration / numberOfGames;

            // Récupérer la date de la dernière partie
            const lastGameDate = userGamePlays.reduce((latestEndDate, play) => {
                if (play.endDate && (!latestEndDate || play.endDate > latestEndDate)) {
                    return play.endDate;
                }
                return latestEndDate;
            }, null);

            // Ajouter les informations du jeu à la liste
            gameInfos.push({
                imageUrl: gameInfo.urlImg,
                name: gameInfo.name,
                topPlayers: sortedTopPlayers,
                numberOfGames,
                averageDuration,
                lastGameDate,
            });
        }

        res.json({
            result: true,
            gameInfos,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ result: false, error: 'Internal Server Error' });
    }
});

// Stats par joueur 

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


// Repartition par type

router.get('/statsByTypes/:token', async (req, res) => {
    try {
        // Trouver l'utilisateur correspondant au token
        const user = await User.findOne({ token: req.params.token });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Récupérer tous les jeux dans le closet de l'utilisateur
        const userCloset = user.closet.map(item => item.idGame);

        // Récupérer tous les types de jeux
        const allTypes = await Type.find();

        // Initialiser un objet pour stocker le nombre de jeux par type
        const gamesByType = {};

        // Compter le nombre de jeux par type dans le closet de l'utilisateur
        for (const type of allTypes) {
            const gamesWithType = await Game.find({ _id: { $in: userCloset }, gameType: type._id });
            gamesByType[type.type] = gamesWithType.length;
        }

        // Calculer le pourcentage de jeux par type
        const totalGames = userCloset.length;
        const percentages = {};
        for (const type of Object.keys(gamesByType)) {
            percentages[type] = (gamesByType[type] / totalGames) * 100;
        }

        res.json({ percentages });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});


router.get('/statsByGame/:token', async (req, res) => {
    try {
        // Récupérer l'utilisateur correspondant au token
        const user = await User.findOne({ token: req.params.token });
        
        if (!user) {
            return res.status(404).json({ result: false, message: 'Utilisateur non trouvé' });
        }

        // Récupérer les parties du joueur
        const gamePlays = await GamesPlay.find({ idUser: user._id });

        // Construire un objet pour stocker les statistiques par jeu
        const statsByGame = {};

        // Parcourir les parties du joueur pour compter le nombre de parties par jeu
        gamePlays.forEach(gamePlay => {
            const gameId = gamePlay.idGame.toString(); // Convertir l'ID du jeu en chaîne pour l'utiliser comme clé
            if (statsByGame.hasOwnProperty(gameId)) {
                // Si le jeu existe déjà dans les statistiques, incrémenter le compteur
                statsByGame[gameId].count++;
            } else {
                // Si le jeu n'existe pas encore dans les statistiques, l'ajouter avec un compteur initialisé à 1
                statsByGame[gameId] = { name: '', count: 1 };
            }
        });

        // Récupérer les noms des jeux à partir de la base de données et les associer aux statistiques
        const gameIds = Object.keys(statsByGame);
        const games = await Game.find({ _id: { $in: gameIds } });
        
        games.forEach(game => {
            const gameId = game._id.toString();
            statsByGame[gameId].name = game.name;
        });

        res.json({ result: true, stats: Object.values(statsByGame) }); // Retourner les statistiques
    } catch (error) {
        console.error('Erreur :', error.message);
        res.status(500).json({ result: false, error: 'Erreur interne du serveur' });
    }
});

module.exports = router;