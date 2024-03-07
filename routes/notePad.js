var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkbody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// Ajout des notes de l'utilisateur depuis la rubrique accessoires

router.post('/', (req, res) => {
    let idUser = '';
    User.findOne({ token: req.body.token })
        .then(user => {
            if (!user) {
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                // récupération de l'iD du user en fonction de son token
                idUser = user._id; 
              
                // insertion en base 
                user.notePad.push({title: 'testTitle', content: 'testContent'});
                user.save()
                .then(() => res.json({ result: true, user }))
                .catch(error => res.json({ result: false, error }));
            }
        })      
});

// Affichage des notes de l'utilisateur dans la rubrique cahier 

router.get('/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                res.json({result: true , notePad : user.notePad})
              }
            
        });
});

router.delete('/:token/:id', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(!user){
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                const notePadIndex = user.notePad.findIndex(note => note._id == req.params.id);
                console.log(notePadIndex)    
                user.notePad.splice(notePadIndex, 1)
                user.save()
                .then(data => {
                    res.json({ result: true, message: 'NotePad deleted successfully' });
                })

            }
        });
});

module.exports = router;
