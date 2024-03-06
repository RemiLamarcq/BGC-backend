var express = require('express');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');
require('../models/types');

//A l'affichage de la page "Armoire", récupération des jeux déjà enregistrés par l'user
router.get('/closet/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                user.populate({
                    path: 'closet.idGame',
                    populate: {
                        path: 'gameType',
                    },
                }).then(user => res.json({ result: true, data: user.closet }));
            }
        });
});

//Lors de la recherche d'un jeu par l'user, récupère tous les noms des jeux de la collection "games"
router.get('/allNames/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else{
                Game.find()
                    .then(data => {
                        const names = data.map(doc => doc.name);
                        res.json({ result: true, gameNames: names });
                    })
                    .catch(error => res.json({ result: false, error }));
            }
        });
});

// Affichage de la page du jeu sélectionné
    //On renvoie les données du jeu et, si le jeu est dans l'armoire de l'user, sa note personnelle.
router.get('/:name/:token', (req, res) => {
    const { token, name } = req.params;
    User.findOne({ token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else{
                const searchRegex = new RegExp(`^${name}$`, 'i');
                Game.findOne({ name: searchRegex })
                    .then(data => {
                        if(!data){
                            res.json({ result: false, error: 'game not found' });
                        } else{
                            data.populate('gameType')
                                .then(game => {
                                    //Vérifie si l'user a déjà le jeu dans l'armoire
                                    const filteredCloset = user.closet.filter(obj => obj.idGame.toString() === game._id.toString());
                                    filteredCloset.length !== 0 ? 
                                        res.json({ 
                                            result: true,
                                            isInCloset: true,
                                            //La déstructuration entraine l'apparition de propriétés internes de l'objet Mongoose 'game'.
                                            //toObject() permet de transformer l'objet Mongoose en objet JS excluant ainsi ces propriétés non désirées.
                                            game: { ...game.toObject(), personalNote: filteredCloset[0].personalNote },
                                        })
                                    :
                                        res.json({
                                            result: true,
                                            isInCloset: false,
                                            game,
                                        });
                                });
                        }
                    });
            }
        });
});

// Ajout d'un jeu dans l'armoire
router.post('/closet/add/:name/:token', (req, res) => {
    const { token, name } = req.params;
    User.findOne({ token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                Game.findOne({ name })
                    .then(game => {
                        user.closet.push({ idGame: game._id, personalNote: 0 });
                        user.save()
                            .then(() => res.json({ result: true }))
                            .catch(error => res.json({ result: false, error }));
                    });
            }
        });
});

module.exports = router;