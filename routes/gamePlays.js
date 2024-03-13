var express = require('express');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');
const GamePlays = require('../models/gamePlays');
const uniqid = require('uniqid');
const mongoose = require('mongoose');

const cloudinary = require('cloudinary').v2
const fs = require('fs');
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
                console.log(idUser, game._id, req.body)
                const { startDate, endDate, players,comment, place, isInterrupted } = req.body;
                // construction de l'objet newGamePlay
                const newGamePlay = new GamePlays({
                    idGame: game._id,
                    idUser,
                    startDate,
                    endDate,
                    players,
                    comment,
                    place,
                    isInterrupted,
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

// route post pour l'upload des photos



router.post('/upload', async (req, res) => {
    const photoPath = `./tmp/${uniqid()}.jpg`;
    const resultMove = await req.files.photoFromFront.mv(photoPath);

    if (!resultMove) {
        try {
            const resultCloudinary = await cloudinary.uploader.upload(photoPath);

            fs.unlinkSync(photoPath);

            // Créer une instance d'ObjectId
            const objectIdInstance = new mongoose.Types.ObjectId();

            // Récupérer l'ID de la partie depuis la requête (à ajuster selon votre structure de données)
            const gameId = objectIdInstance;

            // Mettre à jour la collection gamePlays avec l'URL de la photo
            const updateResult = await GamePlays.updateOne(
                { _id: gameId },
                { $push: { urlImg: resultCloudinary.secure_url } }
            );

            if (updateResult.nModified > 0) {
                res.json({ result: true });
            } else {
                res.json({ result: false, error: 'Failed to update gamePlays' });
            }
        } catch (error) {
            res.json({ result: false, error: error.message });
        }
    } else {
        res.json({ result: false, error: resultMove });
    }
});

module.exports = router;

