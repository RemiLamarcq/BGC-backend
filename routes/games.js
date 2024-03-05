var express = require('express');
var router = express.Router();
const User = require('../models/users');
const Game = require('../models/games');

//A l'affichage de la page "Armoire", récupération des jeux déjà enregistrés par l'user
router.get('/closet/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            user ? 
                res.json({ result: true, data: user.closet }) 
            : 
                res.json({ result: false, error: 'error token, user not found' });
        });
});

//Lors de la recherche d'un jeu par l'user, récupère tous les noms des jeux de la collection "games"
router.get('/allNames/:token', (req, res) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if(user){
                Game.find()
                    .then(data => {
                        const names = data.map(doc => doc.name);
                        res.json({ result: true, gameNames: names });
                    })
                    .catch(error => res.json({ result: false, error }));
            } else{
                res.json({ result: false, error: 'error token, user not found' });
            }
        });
});

//Ajout d'un jeu dans l'armoire
// router.get('/:name/:token', (req, res) => {
//     User.findOne({ token: req.params.token })
//         .then(user => {
//             if(user){
//                 const searchRegex = new RegExp(`^${req.params.name}$`, 'i');
//                 Game.findOne({ name: searchRegex })
//                     .populate('gameType')
//                     .then(game => {
//                         game ?
//                             res.json({ result: true, game })
//                         :
//                             res.json({ result: false, error: 'missing data' });
//                     })
//                     .catch(error => res.json({ result: false, error }));
//             } else{
//                 res.json({ result: false, error: 'error token, user not found' });
//             }
//         });
// });

// router.put('/closet/add/:name/:token', (req, res) => {
//     const { token, name } = req.params;
//     User.findOne({ token })
//         .then(user => {
//             if(user){
//                 Game.findOne({ name })
//                     .then(game => {
//                         User.updateOne({ token }, { closet: })
//                             .then()
//                     })
//             } else {
//                 res.json({ result: false, error: 'error token, user not found' });
//             }
//         })
// });

module.exports = router;