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
			bank: 500, 
			password: req.body.new_password,
			passphrase: req.body.new_passphrase
		});
		new_user.save(function(err, user){
			req.login(user, function(err){
				if (!err){
					res.render('edit_user', { userObj: user, message: "Edit Profile", showMessage: true, showUser: true, user: user.username });
				}
				else{
					res.send(err);
				}
			});
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

	var parseAndSetProto = function(table){
		var thisDeck = JSON.parse(table).prototype = Object.create(deck.BJ.prototype);
		var thisDeckHolder = JSON.parse(table);
		for (var key in thisDeckHolder){
			if (thisDeckHolder.hasOwnProperty(key)){
				thisDeck[key] = thisDeckHolder[key];
			}
		}
		return thisDeck;
	}

	var renderDeck = function(error, deck, table, res, signedIn, user, id){
		if (signedIn && !error){
			if (deck.players.length == 2){
				res.render('one_player', { totalCards: deck.totalCards, 
					showDeck: true, 
					players: deck.players, 
					message: table.name, 
					table_code: table._id.toString(), 
					showMessage: true,
					dealer: deck.players[0],
					first_player: deck.players[1],
					cardSpot: deck.cardSpot,
					betSpot: deck.betSpot,
					showUser: true,
					user: user.username,
					ID: id
				 });
			}
			else if (deck.players.length == 3){
				res.render('two_player', { totalCards: deck.totalCards, 
					showDeck: true, 
					players: deck.players, 
					message: table.name, 
					table_code: table._id.toString(), 
					showMessage: true,
					dealer: deck.players[0],
					first_player: deck.players[1],
					second_player: deck.players[2],
					cardSpot: deck.cardSpot,
					betSpot: deck.betSpot,
					showUser: true,
					user: user.username,
					ID: id
				 });
			}
			else if (deck.players.length == 4){
				res.render('three_player', { totalCards: deck.totalCards, 
					showDeck: true, 
					players: deck.players, 
					message: table.name, 
					table_code: table._id.toString(), 
					showMessage: true,
					dealer: deck.players[0],
					first_player: deck.players[1],
					second_player: deck.players[2],
					third_player: deck.players[3],
					cardSpot: deck.cardSpot,
					betSpot: deck.betSpot,
					showUser: true,
					user: user.username,
					ID: id
				});
			}
		}
		else if (!signedIn && !error){
			if (deck.players.length == 2){
				res.render('one_player', { totalCards: deck.totalCards, 
					showDeck: true, 
					players: deck.players, 
					message: table.name, 
					table_code: table._id.toString(), 
					showMessage: true,
					dealer: deck.players[0],
					first_player: deck.players[1],
					cardSpot: deck.cardSpot,
					betSpot: deck.betSpot
				 });
			}
			else if (deck.players.length == 3){
				res.render('two_player', { totalCards: deck.totalCards, 
					showDeck: true, 
					players: deck.players, 
					message: table.name, 
					table_code: table._id.toString(), 
					showMessage: true,
					dealer: deck.players[0],
					first_player: deck.players[1],
					second_player: deck.players[2],
					cardSpot: deck.cardSpot,
					betSpot: deck.betSpot
				 });
			}
			else if (deck.players.length == 4){
				res.render('three_player', { totalCards: deck.totalCards, 
					showDeck: true, 
					players: deck.players, 
					message: table.name, 
					table_code: table._id.toString(), 
					showMessage: true,
					dealer: deck.players[0],
					first_player: deck.players[1],
					second_player: deck.players[2],
					third_player: deck.players[3],
					cardSpot: deck.cardSpot,
					betSpot: deck.betSpot
				});
			}
		}
		else{
			res.send(error)
		}
	}

	app.post('/join_table', function(req, res){
		if (req.session.passport.user){
			User.findOne({ UID: req.session.passport.user }, function(err, user){
				if (!err){
					Table.findOne({ _id: req.body.table_code }, function(err, table){
						if (!err){
							var thisDeck = parseAndSetProto(table.players);
							thisDeck.addPlayer(user.username, user.UID);
							thisDeck.players[Number(req.body.player)].funds = user.bank;
							table.players = JSON.stringify(thisDeck);
							table.save(function(err, t){
								io.sockets.emit('player_joined', { player: thisDeck.players[thisDeck.players.length - 1], 
									table_code: req.body.table_code
								});
								renderDeck(err, thisDeck, t, res, true, user, req.session.passport.user);
							});
						}
						else{
							res.send(err);
						}
					});
				}
				else{
					res.send(err);
				}
			});
		}
		else{
			Table.findOne({ _id: req.body.table_code }, function(err, table){
				if (!err){
					var thisDeck = parseAndSetProto(table.players);
					var hash = SHA256(req.body.name);
					thisDeck.addPlayer(req.body.name, hash.toString(crypto.enc.Hex));
					table.players = JSON.stringify(thisDeck);
					table.save(function(err, t){
						io.sockets.emit('player_joined', { player: thisDeck.players[thisDeck.players.length - 1], table_code: req.body.table_code });
						renderDeck(err, thisDeck, t, res, false);
					});
				}
				else{
					res.send(err);
				}
			});
		}
	});

	app.get('/leave/:table_code/:number', function(req, res){
		Table.findOne({ _id: req.params.table_code }, function(err, table){
			var thisDeck = JSON.parse(table.players);
			var playerStore = thisDeck.players[req.params.number * 1];
			if (thisDeck.players[req.params.number * 1].playerNum < (thisDeck.playerTotal - 1)){
				for (var i = req.params.number * 1; i < (thisDeck.playerTotal - 1); i++){
					for (var key in thisDeck.players[i]){
						if (thisDeck.players[i].hasOwnProperty(key)){
							if (!Number(key)){
								thisDeck.players[i][key] = thisDeck.players[i + 1][key];
							}
							else{
								var nextKey = Number(key) + 1;
								thisDeck.players[i][key] = thisDeck.players[i + 1][nextKey.toString()];
							}
						}
					}
					thisDeck.players[i].playerNum--;
				}
			}
			thisDeck.players.pop();
			thisDeck.playerTotal--;
			if (thisDeck.playerTotal == 1){
				Table.remove({ _id: req.params.table_code }, function(err){
					res.redirect('/');
				});
			}
			else{
				table.players = JSON.stringify(thisDeck);
				table.save(function(err, t){
					var session = req.session.passport.user||undefined;
					io.sockets.emit('player_left', { player: playerStore, 
						session: session, 
						table_code: req.params.table_code 
					});
					res.redirect('/');
				});
			}
		});
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
			if (req.session.passport.user){
				deck_of_cards.addPlayer(req.body.first_player, req.session.passport.user);
				deck_of_cards.players[1].funds = req.user[0].bank;
			}
			else{
				var hash = SHA256(req.body.first_player);
				deck_of_cards.addPlayer(req.body.first_player, hash.toString(crypto.enc.Hex) + "!1");
			}

		}
		if (req.body.second_player.trim() != undefined && req.body.second_player.trim() != ""){
			var two_hash = SHA256(req.body.second_player);
			deck_of_cards.addPlayer(req.body.second_player, two_hash.toString(crypto.enc.Hex) + "!2");
		}
		if (req.body.third_player.trim() != undefined && req.body.third_player.trim() != ""){
			var three_hash = SHA256(req.body.third_player);
			deck_of_cards.addPlayer(req.body.third_player, three_hash.toString(cryptoJS.enc.Hex) + "!3");
		}
		var new_table;
		var full_route;
		new_table = new Table({ name: req.body.new_table_name,  players: JSON.stringify(deck_of_cards) });
		new_table.url = new_table.name.replace(/[\W\s]/g, '_');;
		new_table.save(function(err, table){
			if (!err) {
				io.sockets.emit('table_created', { newTable: table, url: table.url_route });
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
				if (req.session.passport.user){
					User.findOne({ UID: req.session.passport.user }, function(err, user){
						renderDeck(err, objDeck, t, res, true, user, req.session.passport.user);
					});
				}
				else{
					renderDeck(err, objDeck, t, res, false);
				}
			}
			else{
				res.send(err);
			}
		});
	});


	app.post('/bet', function(req, res){
		Table.findOne({ _id: req.body.table_code }).exec(function(err, t){
			var betId = req.body.UID;
			if (!err){
				var thisDeck = JSON.parse(t.players);
				deck_of_cards.placeBet.call(thisDeck, req.body.bet);
				var playerSpot = thisDeck.betSpot - 1;
				t.players = JSON.stringify(thisDeck);
				t.save(function(err, t){
					if (req.session.passport.user){
						User.findOne({ UID: req.session.passport.user }, function(err, user){
							if (req.session.passport.user == betId){
								user.bank = thisDeck.players[playerSpot].funds;
								user.save(function(err, u){
									io.sockets.emit('player_bet', { bet: req.body.bet, playerSpot: playerSpot });
									renderDeck(err, thisDeck, t, res, true, user, req.session.passport.user);
								});
							}
							else{
								io.sockets.emit('player_bet', { bet: req.body.bet, playerSpot: playerSpot });
								renderDeck(err, thisDeck, t, res, true, user, req.session.passport.user);
							}
						});
					}
					else{
						io.sockets.emit('player_bet', { bet: req.body.bet, playerSpot: playerSpot });
						renderDeck(err, thisDeck, t, res, false);
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
			var betsIn = true;
			if (!err){
				var thisDeck = parseAndSetProto(t.players);
				thisDeck.players.forEach(function(player){
					if (player.name != "dealer"){
						if (player.bet == 0){
							betIn = false;
						}
					}
				});
				if (!betsIn){
					io.sockets.emit('missing_bets', { message: "Please make sure all players have placed bets!" });
					res.render('index', { totalCards: thisDeck.totalCards, showDeck: true, showMessage: true, message: "Please make sure all players have placed bets!", players: thisDeck.players, table_code: t.table_code });
				}
				else{
					if (req.session.passport.user){
						User.findOne({ UID: req.session.passport.user }, function(err, user){
							thisDeck.assignCard();
							t.players = JSON.stringify(thisDeck);
							t.save(function(err, t){
								console.log(thisDeck.cardSpot, thisDeck.firstDeal);
								if (thisDeck.cardSpot == 1 && thisDeck.firstDeal == true) io.sockets.emit('end_of_hand', { thisDeck: thisDeck, message: "end_of_hand" });
								else io.sockets.emit('player_deal', { cardSpot: thisDeck.cardSpot - 1, players: thisDeck.players });
								renderDeck(err, thisDeck, t, res, true, user, req.session.passport.user);
							});
						});
					}
					else{
						thisDeck.assignCard();
						t.players = JSON.stringify(thisDeck);
						t.save(function(err, t){
							console.log(thisDeck.cardSpot, thisDeck.firstDeal);
							if (thisDeck.cardSpot == 1 && thisDeck.firstDeal == true) io.sockets.emit('end_of_hand', { thisDeck: thisDeck, message: "end_of_hand" });
							else io.sockets.emit('player_deal', { cardSpot: thisDeck.cardSpot - 1, players: thisDeck.players });
							renderDeck(err, thisDeck, t, res, false);
						});	
					}
				}

			}
			else{
				res.send(err);
			}
		});
	});

	app.get('/hold/:table_code', function(req, res){
		Table.findOne({ _id: req.params.table_code }).exec(function(err, t){
			if (!err){
				var thisDeck = parseAndSetProto(t.players);
				if (req.session.passport.user){
					User.findOne({ UID: req.session.passport.user }, function(err, user){
						thisDeck.hold();
						t.players = JSON.stringify(thisDeck);
						t.save(function(err, t){
							if (thisDeck.cardSpot == 1) io.sockets.emit('end_of_hand', { thisDeck: thisDeck, message: "End of hand" });
							else io.sockets.emit('player_hold', { thisDeck: thisDeck });
							renderDeck(err, thisDeck, t, res, true, user, req.session.passport.user);
						});
					});
				}
				else{
					thisDeck.hold();
					t.players = JSON.stringify(thisDeck);
					t.save(function(err, t){
						if (thisDeck.cardSpot == 1) io.sockets.emit('end_of_hand', { thisDeck: thisDeck, message: "End of hand" });
						else io.sockets.emit('player_hold', { thisDeck: thisDeck });
						renderDeck(err, thisDeck, t, res, false);
					});
				}		
			}
		});
	});
	

	app.get('/double_down/:table_code/:player_code', function(req, res){
		Table.findOne({ _id: req.params.table_code }).exec(function(err, t){
			var thisDeck = parseAndSetProto(t.players);
			thisDeck.doubleDown();
			var playerSpot = thisDeck.cardSpot - 1;
			var betId = req.params.player_code;
			if (!err){
				if (req.session.passport.user){
					User.findOne({ UID: req.session.passport.user }, function(err, user){
						if (req.session.passport.user == betId){
							user.bank = thisDeck.players[playerSpot].funds;
							user.save(function(err, u){
								t.players = JSON.stringify(thisDeck);
								t.save(function(err, table){
									io.sockets.emit('player_double', { cardSpot: playerSpot, players: thisDeck.players });
									renderDeck(err, thisDeck, table, res, true, user, req.session.passport.user);
								});
							});
						}
						else{
							t.players = JSON.stringify(thisDeck);
							t.save(function(err, table){
								io.sockets.emit('player_double', { cardSpot: playerSpot, players: thisDeck.players });
								renderDeck(err, thisDeck, table, res, true, user, req.session.passport.user);
							});
						}
					});
				}
				else{
					t.players = JSON.stringify(thisDeck);
					t.save(function(err, t){
						io.sockets.emit('player_double', { cardSpot: playerSpot, players: thisDeck.players });
						renderDeck(err, thisDeck, t, res, false);
					});
				}
			}
		});
	});

	app.get('/reset', function(req, res){
		Table.remove({}).exec(function(err){
			res.redirect('/');
		});
	});

	app.get('/resetUsers', function(req, res){
		User.remove({}).exec(function(err){
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