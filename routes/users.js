var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkbody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['email', 'password' , 'username'])) {
    res.json({ result: false, error: 'Champ(s) vide(s) ou manquant(s)' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        password: hash,
        username: req.body.username,
        token: uid2(32),
        friendsName : req.body.username
      });

      newUser.save().then(newUser => {
        res.json({ result: true, token: newUser.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'Utilisateur déjà existant' });
    }
  });
});

router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Champ(s) vide(s) ou manquant(s)' });
    return;
  }

  User.findOne({ email: req.body.email }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username});
    } else {
      res.json({ result: false, error: 'Utilisateur non trouvé ou mot de passe incorrect' });
    }
  });
});



module.exports = router;
