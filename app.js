require('dotenv').config();
require('./models/connection');
require('./models/gamePlays');
require('./models/types');
require('./models/users');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gamesRouter = require('./routes/games');
var gamePlayRouter = require('./routes/gamePlays');
var notePadRouter = require('./routes/notePad');
var friendsRouter = require('./routes/friends');



var app = express();
const cors = require('cors');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/games', gamesRouter);
app.use('/gamePlays',gamePlayRouter);
app.use('/notePad',notePadRouter);
app.use('/friends',friendsRouter)


module.exports = app;
