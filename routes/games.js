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

/* Lors de l'ajout d'un nouveau jeu, recherche leur présence en BDD de manière insensible à la casse via l'input de la barre de recherche */
router.get('/search/:name', (req, res) => {
    const searchRegex = new RegExp(req.params.name, 'i');
    Game.find({ name: { $regex: searchRegex } })
        .then(data => {
            data.length !== 0 ? 
                res.json({ result: true, data }) 
            : 
                res.json({ result: false, error: 'no match found' });
        });
});

// router.post('/update' ,(req,res) => {
//     Game.updateMany(
//         { urlImg: 'unknown.jpg' },
//         { urlImg: 'https://res.cloudinary.com/dml7gsvpj/image/upload/v1709636654/unknown_qjfsel.jpg' }
//        ).then(() => {
//         Game.find().then(data => {
//           console.log(data);
//         });
//        });
// })


module.exports = router;