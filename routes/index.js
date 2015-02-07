var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var aes = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var crypto = require("crypto-js");
var deck = require('../blackjack');
var Table = require("../models").Table;
var User = require("../models").User;
module.exports = function(app, io){

	var deck_of_cards = deck.Blackjack();
	
	app.get('/new_user', function(req, res){
		res.render('new_user', { message: "Thanks for Joining Blackjack", showMessage: true });
	});

	app.post('/new_user', function(req, res){
		var new_user = new User({ name: req.body.first_name, 
			UID: req.body.new_username,
			username: req.body.new_username, 
			bank: 100, 
			password: req.body.new_password,
			passphrase: req.body.new_passphrase
		});
		new_user.save(function(err, user){
			res.render('edit_user', { userObj: user, message: "Edit Profile", showMessage: true, showUser: true, user: user.username });
		});
	});

	app.get('/edit_user', function(req, res){
		User.findOne({ UID: req.session.passport.user }, function(err, user){
			res.render('edit_user', { userObj: user, message: "Edit Profile", showMessage: true, showUser: true, user: user.username });
		});
	});

	app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

	app.get('/login', function(req,res) {
		res.render('sign_in', { message: "Sign In", showMessage: true, });
	});

	app.get('/', function(req, res){
		if (req.session.passport.user){
			User.findOne({ UID: req.session.passport.user }, function(err, user){
				Table.find().exec(function(err, tables){
					if (!err && tables.length != 0){
						res.render('landing', { message: "Available Tables", tables: tables,  showTableList: true, showUser: true, user: user.username });		
					}
					else{
						res.render('landing', { message: "There are no available tables, start one above", showUser: true, user: user.username });
					}
				});
			});
		}
		else{
			Table.find().exec(function(err, tables){
				if (!err && tables.length != 0){
					res.render('landing', { message: "Available Tables", tables: tables,  showTableList: true });		
				}
				else{
					res.render('landing', { message: "There are no available tables, start one above" });
				}
			});
		}
	});

	app.post('/table/init', function(req, res){
		if (req.body.create_table == undefined || req.body.create_table == ""){
			res.redirect('/');
		}
		else{
			if (req.session.passport.user){
				User.findOne({ UID: req.session.passport.user }, function(err, user){
					res.render('tables', { table_name: req.body.create_table, message: "Create New Table", showMessage: true, showUser: true, user: user.username });
				});
			}
			else{
				res.render('tables', { table_name: req.body.create_table, message: "Create New Table", showMessage: true });
			}
		}
	});

	app.post('/table/submit', function(req, res){
		deck_of_cards = deck.Blackjack();
		deck_of_cards.shuffle();
		if (req.body.first_player.trim() != undefined && req.body.first_player.trim() != ""){
			deck_of_cards.addPlayer(req.body.first_player);
		}
		if (req.body.second_player.trim() != undefined && req.body.second_player.trim() != ""){
			deck_of_cards.addPlayer(req.body.second_player);
		}
		if (req.body.third_player.trim() != undefined && req.body.third_player.trim() != ""){
			deck_of_cards.addPlayer(req.body.third_player);
		}
		var new_table;
		var full_route;
		new_table = new Table({ name: req.body.new_table_name,  players: JSON.stringify(deck_of_cards) });
		new_table.url = new_table.name.replace(/[\W\s]/g, '_');;
		new_table.save(function(err, table){
			if (!err) {
				res.redirect(table.url_route);
			}
			else{
				res.send(err);
			}
		});

	});

	app.get('/games/:table_code/:url', function(req, res){
		Table.findOne({ _id: req.params.table_code, url: req.params.url }).exec(function(err, t){
			if (!err){
				var objDeck = JSON.parse(t.players);
				if (objDeck.players.length == 2){
					res.render('one_player', { totalCards: objDeck.totalCards, 
						showDeck: true, 
						players: objDeck.players, 
						message: "Welcome to table " + t.name, 
						table_code: t._id.toString(), 
						showMessage: true,
						dealer: objDeck.players[0],
						first_player: objDeck.players[1]
						 });
				}
				else if (objDeck.players.length == 3){
					res.render('two_player', { totalCards: objDeck.totalCards, 
						showDeck: true, 
						players: objDeck.players, 
						message: "Welcome to table " + t.name, 
						table_code: t._id.toString(), 
						showMessage: true,
						dealer: objDeck.players[0],
						first_player: objDeck.players[1],
						second_player: objDeck.players[2]
					});
				}
				else if (objDeck.players.length == 4){
					res.render('three_player', { totalCards: objDeck.totalCards, 
						showDeck: true, 
						players: objDeck.players, 
						message: "Welcome to table " + t.name, 
						table_code: t._id.toString(), 
						showMessage: true,
						dealer: objDeck.players[0],
						first_player: objDeck.players[1],
						second_player: objDeck.players[2],
						third_player: objDeck.players[3]
					});
				}
			}
			else{
				res.send(err);
			}
		});
	});


	app.post('/bet', function(req, res){
		Table.findOne({ _id: req.body.table_code }).exec(function(err, t){
			if (!err){
				var thisDeck = JSON.parse(t.players);
				deck_of_cards.placeBet.call(thisDeck, req.body.bet);
				t.players = JSON.stringify(thisDeck);
				t.save(function(err, t){
					if (thisDeck.players.length == 2){
						res.render('one_player', { totalCards: thisDeck.totalCards, 
							showDeck: true, 
							players: thisDeck.players, 
							message: t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: thisDeck.players[0],
							first_player: thisDeck.players[1]
						 });
					}
					else if (thisDeck.players.length == 3){
						res.render('two_player', { totalCards: thisDeck.totalCards, 
							showDeck: true, 
							players: thisDeck.players, 
							message: t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: thisDeck.players[0],
							first_player: thisDeck.players[1],
							second_player: thisDeck.players[2]
						 });
					}
					else if (thisDeck.players.length == 4){
						res.render('three_player', { totalCards: thisDeck.totalCards, 
							showDeck: true, 
							players: thisDeck.players, 
							message: t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: thisDeck.players[0],
							first_player: thisDeck.players[1],
							second_player: thisDeck.players[2],
							third_player: thisDeck.players[3]
						});
					}
				});
			}
			else{
				console.log(err);
				res.redirect('/');
			}
		});
	});

	app.get('/deal/:table_code', function(req, res){
		Table.findOne({ _id: req.params.table_code }).exec(function(err, t){
			if (!err){
				var betIn = true;
				var thisDeck = JSON.parse(t.players);
				thisDeck.players.forEach(function(player){
					if (player.name != "dealer"){
						if (player.bet == 0){
							betIn = false;
						}
					}
				});
				if (!betIn){
					res.render('index', { totalCards: thisDeck.totalCards, showDeck: true, showMessage: true, message: "Please make sure all players have placed bets!", players: thisDeck.players, table_code: t.table_code });
				}
				else{
					thisDeck.__proto__ = deck_of_cards.__proto__;
					thisDeck.assignCard();
					t.players = JSON.stringify(thisDeck);
					t.save(function(err, t){
						if (thisDeck.players.length == 2){
							res.render('one_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1]
							 });
						}
						else if (thisDeck.players.length == 3){
							res.render('two_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1],
								second_player: thisDeck.players[2]
							 });
						}
						else if (thisDeck.players.length == 4){
							res.render('three_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1],
								second_player: thisDeck.players[2],
								third_player: thisDeck.players[3]
							 });
						}
					});
				}
			}
		});
	});

	app.get('/hold/:table_code', function(req, res){
		Table.findOne({ _id: req.params.table_code }).exec(function(err, t){
			if (!err){
				var thisDeck = JSON.parse(t.players);
				thisDeck.__proto__ = deck_of_cards.__proto__;
				thisDeck.hold();
				t.players = JSON.stringify(thisDeck);
				t.save(function(err, t){
					if (thisDeck.players.length == 2){
						res.render('one_player', { totalCards: thisDeck.totalCards, 
							showDeck: true, 
							players: thisDeck.players, 
							message: t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: thisDeck.players[0],
							first_player: thisDeck.players[1]
						 });
					}
					else if (thisDeck.players.length == 3){
						res.render('two_player', { totalCards: thisDeck.totalCards, 
							showDeck: true, 
							players: thisDeck.players, 
							message: t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: thisDeck.players[0],
							first_player: thisDeck.players[1],
							second_player: thisDeck.players[2]
						 });
					}
					else if (thisDeck.players.length == 4){
						res.render('three_player', { totalCards: thisDeck.totalCards, 
							showDeck: true, 
							players: thisDeck.players, 
							message: t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: thisDeck.players[0],
							first_player: thisDeck.players[1],
							second_player: thisDeck.players[2],
							third_player: thisDeck.players[3]
						});
					}
				});
			}
		});
	});
	

	app.get('/double_down/:table_code', function(req, res){
		Table.findOne({ _id: req.params.table_code }).exec(function(err, t){
			if (!err){
					var thisDeck = JSON.parse(t.players);
					thisDeck.__proto__ = deck_of_cards.__proto__;
					thisDeck.doubleDown();
					t.players = JSON.stringify(thisDeck);
					t.save(function(err, t){
						if (thisDeck.players.length == 2){
							res.render('one_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1]
							 });
						}
						else if (thisDeck.players.length == 3){
							res.render('two_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1],
								second_player: thisDeck.players[2]
							 });
						}
						else if (thisDeck.players.length == 4){
							res.render('three_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1],
								second_player: thisDeck.players[2],
								third_player: thisDeck.players[3]
							 });
						}
					});
				}
		});
	});

	app.get('/reset', function(req, res){
		Table.remove({}).exec(function(err){
			res.redirect('/');
		});
	});

	passport.use(new LocalStrategy(
		function(username, password, done) {
			User.findOne({ username: username }, function(err, user){
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, { message: "Incorrect username" });
				}
				if (!user.validatePassword(password)) {
					return done(null, false, { message: "Incorrect password" });
				}
				return done(null, user);
			});
		})
	);

	passport.serializeUser(function(user, done) {
	  done(null, user.UID);
	});

	passport.deserializeUser(function(id, done) {
	  User.find({ UID: id }, function(err, user) {
	    done(err, user);
	  });
	});

}