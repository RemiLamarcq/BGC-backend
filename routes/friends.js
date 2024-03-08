var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/users');


router.post('/addFriend/:token', (req, res) => {
    User.findOne({ token: req.params.token })
    .then(user => {
        if(!user){
            res.json({ result: false, error: 'error token, user not found' });
        } else{
            user.friendsName.push(req.body.newFriend);
                user.save()
                .then(() => res.json({ result: true, friendsName : user.friendsName}))
                .catch(error => res.json({ result: false, error }));
        }
    })
  });

  router.get('/getFriends/:token', (req, res) => {
    User.findOne({ token: req.params.token })
    .then(user => {
        if(!user){
            res.json({ result: false, error: 'error token, user not found' });
        } else{
            User.findOne({token : req.params.token})
            .then (friends => {
                res.json({result : true, friendsName : friends.friendsName})
            })
        }
    })
  });

  module.exports = router;
