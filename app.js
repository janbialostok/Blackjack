var express = require('express');
var app = express();
var morgan = require('morgan');
var swig = require('swig');
var routes = require('./routes/');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static('public'));
app.use("/images", express.static(__dirname + '/images'));
app.use(session({ 
	resave: false,
	saveUninitialized: true,
	secret: "blackjack" }));
app.use(passport.initialize());
app.use(passport.session());

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
swig.setDefaults({ cache: false });

var server = app.listen(2000);
var io = socketio.listen(server);
routes(app, io);
