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
const multer = require('multer'); // Middleware pour gérer les fichiers multipart/form-data
const upload = multer(); // Configuration de multer

// Ajout de la route POST pour ajouter une partie (gère l'envoi de données multipart/form-data)

router.post('/', async (req, res) => {
    // Récupération des données JSON envoyées dans les en-têtes
    const jsonData = JSON.parse(req.body.json);
    let userId = '';
    let gamePlayId = '';

    //Enregistrement des données JSON en base
    User.findOne({ token: jsonData.token })
        .then(user => {
            if (!user) {
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                // récupération de l'iD du user en fonction de son token
                userId = user._id;
                // récupération de l'ID du jeu en fonction de son nom
                return Game.findOne({ name: jsonData.name });
            }
        })
        .then(game => {
            if (!game) {
                res.json({ result: false, error: 'game not found' });
            } else {
                const { startDate, endDate, players, place, isInterrupted, comment } = jsonData;
                const newGamePlay = new GamePlays({
                    idGame: game._id,
                    idUser: userId,
                    startDate,
                    endDate,
                    players,
                    place,
                    urlImage: [],
                    isInterrupted,
                    comment,
                });
                return newGamePlay.save();
            }
        }) // Gestion de l'enregistrement des photos
        .then(async (newGamePlay) => {
            newGamePlay && (gamePlayId = newGamePlay._id);
            // Récupérer les données du formulaire multipart/form-data
            const formData = req.files;
            //Copie des fichiers images dans un dossier temporaire
            const fileUploadPromises = [];
            const photoPathsList = [];
            for (const key in formData) {
                const photoPath = `./tmp/${uniqid()}.jpg`;
                photoPathsList.push(photoPath);
                fileUploadPromises.push( await formData[key].mv(photoPath));
            }
            // Si aucune photo n'est postée par l'user
            if(photoPathsList.length === 0){
                res.json({ result: true });
                return;
            }

            // Une fois que toutes les photos sont stockées dans le dossier tmp,
            // on les enregistre dans cloudinary puis en bdd dans la nouvelle partie créée.
            Promise.all(fileUploadPromises)
                .then(async () => {
                    // Toutes les images ont été téléchargées avec succès
                    try {
                        const cloudinaryUploadPromises = [];
                        
                        // Parcourir les fichiers téléchargés et les charger dans Cloudinary
                        for (const photoPath of photoPathsList) {
                            const resultCloudinary = await cloudinary.uploader.upload(photoPath);
                            cloudinaryUploadPromises.push(resultCloudinary.secure_url);
                            fs.unlinkSync(photoPath);
                        }
            
                        // Attendre que toutes les images soient chargées dans Cloudinary
                        await Promise.all(cloudinaryUploadPromises);
            
                        // Mettre à jour la collection GamePlays avec les URL des images
                        const updateResult = await GamePlays.updateOne(
                            { _id: newGamePlay._id },
                            { $push: { urlImage: { $each: cloudinaryUploadPromises } } }
                        );
                        if (updateResult.modifiedCount > 0) {
                            res.json({ result: true });
                        } else {
                            res.json({ result: false, error: 'Erreur lors de l\enregistrement des photos en bdd' });
                        }
                    } catch (error) {
                        res.json({ result: false, error: 'Erreur lors de l\'enregistrement des photos dans cloudinary' });
                    }
                })
                .catch(() => {
                    res.json({ result: false, error: 'Erreur lors de l\enregistrement des photos dans le fichier tmp' });
                });
        })
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

