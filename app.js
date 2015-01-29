var express = require('express');
var app = express();
var morgan = require('morgan');
var swig = require('swig');
var routes = require('./routes/');
var bodyParser = require('body-parser');
var socketio = require('socket.io');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static('public'));

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
swig.setDefaults({ cache: false });

var server = app.listen(2000);
var io = socketio.listen(server);
routes(app, io);
