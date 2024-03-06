var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkbody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

router.post('/', (req, res) => {
    let idUser = '';
    User.findOne({ token: req.body.token })
        .then(user => {
            if (!user) {
                res.json({ result: false, error: 'error token, user not found' });
            } else {
                // récupération de l'iD du user en fonction de son token
                idUser = user._id; 
                const newNotePad = new User({
                    notePad : [{title: 'testTitle', content: 'testContent'}]
                });
                // et insertion en base 
                newNotePad.save().then(newNote => {
                    res.json({result : true, newNote})
                }) 

            }
        })
        
});

module.exports = router;
