var express = require('express');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');
const GamePlays = require('../models/gamePlays');
require('../models/types');

const app = express();

// Ajout de la route POST pour ajouter une partie

router.post('/', (req, res) => {
    let idUser = '';


    User.findOne({ token: req.body.token })
        .then(user => {
            if (!user) {
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                // récupération de l'iD du user en fonction de son token
                idUser = user._id;
                
       

                // récupération de l'ID du jeu en fonction de son nom
                return Game.findOne({ name: req.body.name });
            }
        })
        .then(game => {
            if (!game) {
                res.json({ result: false, error: 'game not found' });
            } else {
                console.log('idGame', game._id)
                // construction de l'objet newGamePlay
                const newGamePlay = new GamePlays({
                    idGame: game._id,
                    idUser,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    players: [{friendName : 'toto', isWinner : true},{friendName : 'titi', isWinner : false}],
                    urlImage: req.body.urlImage,
                    comment: req.body.comment,
                    place: req.body.place,
                    isInterrupted: req.body.isInterrupted
                });

                // et insertion en base
                return newGamePlay.save();
            }
        })
        .then(newGamePlay => {
            res.json({ result: true, idGamePlay :newGamePlay._id });
        })
        .catch(error => {
            res.json({ result: false, error: error.message });
        });
});

// Affichage des parties de l'utilisateur dans la rubrique cahier 

router.get('/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else {
              GamePlays.find({idUser : user._id})
              .populate('idGame')
              .then (gamePlays => {
                res.json({result: true , gamePlays})
              })
            }
        });
});

// suppression de'une partie de l'utilisateur dans la rubrique cahier 

router.delete('/:token/:id', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                GamePlays.deleteOne({_id: req.params.id}).then(data => {
                    res.json({result : true, data})
                })              
            }
        });
});


module.exports = router;

