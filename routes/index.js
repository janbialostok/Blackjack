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

	var renderDeck = function(error, deck, table, res, session, user, id){
		if (session && !error){
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
		else if (!session && !error){
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
					thisDeck.addPlayer(req.body.name);
					table.players = JSON.stringify(thisDeck);
					table.save(function(err, t){
						renderDeck(err, thisDeck, t, res, false);
					});
				}
				else{
					res.send(err);
				}
			});
		}
	});
	
	// app.post('/join_table', function(req, res){
	// 	if (req.session.passport.user){
	// 		User.findOne({ UID: req.session.passport.user }, function(err, user){
	// 			if (!err){
	// 				Table.findOne({ _id: req.body.table_code }, function(err, table){
	// 					if (!err){
	// 						var thisDeck = parseAndSetProto(table.players);
	// 						thisDeck.addPlayer(user.username, user.UID);
	// 						thisDeck.players[Number(req.body.player)].funds = user.bank;
	// 						table.players = JSON.stringify(thisDeck);
	// 						table.save(function(err, t){
	// 							if (thisDeck.players.length == 2){
	// 								res.render('one_player', { totalCards: thisDeck.totalCards, 
	// 									showDeck: true, 
	// 									players: thisDeck.players, 
	// 									message: t.name, 
	// 									table_code: t._id.toString(), 
	// 									showMessage: true,
	// 									dealer: thisDeck.players[0],
	// 									first_player: thisDeck.players[1],
	// 									cardSpot: thisDeck.cardSpot,
	// 									betSpot: thisDeck.betSpot,
	// 									showUser: true,
	// 									user: user.username,
	// 									ID: req.session.passport.user
	// 								 });
	// 							}
	// 							else if (thisDeck.players.length == 3){
	// 								res.render('two_player', { totalCards: thisDeck.totalCards, 
	// 									showDeck: true, 
	// 									players: thisDeck.players, 
	// 									message: t.name, 
	// 									table_code: t._id.toString(), 
	// 									showMessage: true,
	// 									dealer: thisDeck.players[0],
	// 									first_player: thisDeck.players[1],
	// 									second_player: thisDeck.players[2],
	// 									cardSpot: thisDeck.cardSpot,
	// 									betSpot: thisDeck.betSpot,
	// 									showUser: true,
	// 									user: user.username,
	// 									ID: req.session.passport.user
	// 								 });
	// 							}
	// 							else if (thisDeck.players.length == 4){
	// 								res.render('three_player', { totalCards: thisDeck.totalCards, 
	// 									showDeck: true, 
	// 									players: thisDeck.players, 
	// 									message: t.name, 
	// 									table_code: t._id.toString(), 
	// 									showMessage: true,
	// 									dealer: thisDeck.players[0],
	// 									first_player: thisDeck.players[1],
	// 									second_player: thisDeck.players[2],
	// 									third_player: thisDeck.players[3],
	// 									cardSpot: thisDeck.cardSpot,
	// 									betSpot: thisDeck.betSpot,
	// 									showUser: true,
	// 									user: user.username,
	// 									ID: req.session.passport.user
	// 								});
	// 							}
	// 						});
	// 					}
	// 					else{	
	// 						res.send(err);
	// 					}
	// 				});
	// 			}
	// 			else{	
	// 				res.send(err);
	// 			}
	// 		});
	// 	}
	// 	else{
	// 		Table.findOne({ _id: req.body.table_code }, function(err, table){
	// 			if (!err){
	// 				var thisDeck = parseAndSetProto(table.players);
	// 				thisDeck.addPlayer(req.body.name);
	// 				table.players = JSON.stringify(thisDeck);
	// 				table.save(function(err, t){
	// 					if (thisDeck.players.length == 2){
	// 						res.render('one_player', { totalCards: thisDeck.totalCards, 
	// 							showDeck: true, 
	// 							players: thisDeck.players, 
	// 							message: t.name, 
	// 							table_code: t._id.toString(), 
	// 							showMessage: true,
	// 							dealer: thisDeck.players[0],
	// 							first_player: thisDeck.players[1],
	// 							cardSpot: thisDeck.cardSpot,
	// 							betSpot: thisDeck.betSpot
	// 						 });
	// 					}
	// 					else if (thisDeck.players.length == 3){
	// 						res.render('two_player', { totalCards: thisDeck.totalCards, 
	// 							showDeck: true, 
	// 							players: thisDeck.players, 
	// 							message: t.name, 
	// 							table_code: t._id.toString(), 
	// 							showMessage: true,
	// 							dealer: thisDeck.players[0],
	// 							first_player: thisDeck.players[1],
	// 							second_player: thisDeck.players[2],
	// 							cardSpot: thisDeck.cardSpot,
	// 							betSpot: thisDeck.betSpot
	// 						 });
	// 					}
	// 					else if (thisDeck.players.length == 4){
	// 						res.render('three_player', { totalCards: thisDeck.totalCards, 
	// 							showDeck: true, 
	// 							players: thisDeck.players, 
	// 							message: t.name, 
	// 							table_code: t._id.toString(), 
	// 							showMessage: true,
	// 							dealer: thisDeck.players[0],
	// 							first_player: thisDeck.players[1],
	// 							second_player: thisDeck.players[2],
	// 							third_player: thisDeck.players[3],
	// 							cardSpot: thisDeck.cardSpot,
	// 							betSpot: thisDeck.betSpot
	// 						});
	// 					}
	// 				});
	// 			}
	// 			else{
	// 				res.send(err);
	// 			}

	// 		});
	// 	}
	// });

	app.get('/leave/:table_code/:number', function(req, res){
		Table.findOne({ _id: req.params.table_code }, function(err, table){
			var thisDeck = JSON.parse(table.players);
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
				deck_of_cards.addPlayer(req.body.first_player);
			}

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
				if (req.session.passport.user){
					User.findOne({ UID: req.session.passport.user }, function(err, user){
						if (objDeck.players.length == 2){
							res.render('one_player', { totalCards: objDeck.totalCards, 
								showDeck: true, 
								players: objDeck.players, 
								message: "Welcome to table " + t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: objDeck.players[0],
								first_player: objDeck.players[1],
								cardSpot: objDeck.cardSpot,
								betSpot: objDeck.betSpot,
								showUser: true, 
								user: user.username,
								ID: req.session.passport.user
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
								second_player: objDeck.players[2],
								cardSpot: objDeck.cardSpot,
								betSpot: objDeck.betSpot,
								showUser: true, 
								user: user.username,
								ID: req.session.passport.user
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
								third_player: objDeck.players[3],
								cardSpot: objDeck.cardSpot,
								betSpot: objDeck.betSpot,
								showUser: true, 
								user: user.username,
								ID: req.session.passport.user
							});
						}
					});
				}
				else{
					if (objDeck.players.length == 2){
						res.render('one_player', { totalCards: objDeck.totalCards, 
							showDeck: true, 
							players: objDeck.players, 
							message: "Welcome to table " + t.name, 
							table_code: t._id.toString(), 
							showMessage: true,
							dealer: objDeck.players[0],
							first_player: objDeck.players[1],
							cardSpot: objDeck.cardSpot,
							betSpot: objDeck.betSpot
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
							second_player: objDeck.players[2],
							cardSpot: objDeck.cardSpot,
							betSpot: objDeck.betSpot
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
							third_player: objDeck.players[3],
							cardSpot: objDeck.cardSpot,
							betSpot: objDeck.betSpot
						});
					}
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
									if (thisDeck.players.length == 2){
										res.render('one_player', { totalCards: thisDeck.totalCards, 
											showDeck: true, 
											players: thisDeck.players, 
											message: t.name, 
											table_code: t._id.toString(), 
											showMessage: true,
											dealer: thisDeck.players[0],
											first_player: thisDeck.players[1],
											cardSpot: thisDeck.cardSpot,
											betSpot: thisDeck.betSpot,
											showUser: true,
											user: user.username,
											ID: req.session.passport.user
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
											second_player: thisDeck.players[2],
											cardSpot: thisDeck.cardSpot,
											betSpot: thisDeck.betSpot,
											showUser: true,
											user: user.username,
											ID: req.session.passport.user
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
											third_player: thisDeck.players[3],
											cardSpot: thisDeck.cardSpot,
											betSpot: thisDeck.betSpot,
											showUser: true,
											user: user.username,
											ID: req.session.passport.user
										});
									}
								});
							}
							else{
								if (thisDeck.players.length == 2){
									res.render('one_player', { totalCards: thisDeck.totalCards, 
										showDeck: true, 
										players: thisDeck.players, 
										message: t.name, 
										table_code: t._id.toString(), 
										showMessage: true,
										dealer: thisDeck.players[0],
										first_player: thisDeck.players[1],
										cardSpot: thisDeck.cardSpot,
										betSpot: thisDeck.betSpot,
										showUser: true,
										user: user.username,
										ID: req.session.passport.user
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
										second_player: thisDeck.players[2],
										cardSpot: thisDeck.cardSpot,
										betSpot: thisDeck.betSpot,
										showUser: true,
										user: user.username,
										ID: req.session.passport.user
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
										third_player: thisDeck.players[3],
										cardSpot: thisDeck.cardSpot,
										betSpot: thisDeck.betSpot,
										showUser: true,
										user: user.username,
										ID: req.session.passport.user
									});
								}
							}
						});
					}
					else{
						if (thisDeck.players.length == 2){
							res.render('one_player', { totalCards: thisDeck.totalCards, 
								showDeck: true, 
								players: thisDeck.players, 
								message: t.name, 
								table_code: t._id.toString(), 
								showMessage: true,
								dealer: thisDeck.players[0],
								first_player: thisDeck.players[1],
								cardSpot: thisDeck.cardSpot,
								betSpot: thisDeck.betSpot
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
								second_player: thisDeck.players[2],
								cardSpot: thisDeck.cardSpot,
								betSpot: thisDeck.betSpot
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
								third_player: thisDeck.players[3],
								cardSpot: thisDeck.cardSpot,
								betSpot: thisDeck.betSpot
							});
						}
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
					res.render('index', { totalCards: thisDeck.totalCards, showDeck: true, showMessage: true, message: "Please make sure all players have placed bets!", players: thisDeck.players, table_code: t.table_code });
				}
				else{
					if (req.session.passport.user){
						User.findOne({ UID: req.session.passport.user }, function(err, user){
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
										first_player: thisDeck.players[1],
										cardSpot: thisDeck.cardSpot,
										betSpot: thisDeck.betSpot,
										showUser: true,
										user: user.username,
										ID: req.session.passport.user
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
										second_player: thisDeck.players[2],
										cardSpot: thisDeck.cardSpot,
										betSpot: thisDeck.betSpot,
										showUser: true,
										user: user.username,
										ID: req.session.passport.user
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
										third_player: thisDeck.players[3],
										cardSpot: thisDeck.cardSpot,
										betSpot: thisDeck.betSpot,
										showUser: true,
										user: user.username,
										ID: req.session.passport.user
									 });
								}
							});
						});
					}
					else{
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
									first_player: thisDeck.players[1],
									cardSpot: thisDeck.cardSpot,
									betSpot: thisDeck.betSpot	
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
									second_player: thisDeck.players[2],
									cardSpot: thisDeck.cardSpot,
									betSpot: thisDeck.betSpot
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
									third_player: thisDeck.players[3],
									cardSpot: thisDeck.cardSpot,
									betSpot: thisDeck.betSpot
								 });
							}
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
							if (thisDeck.players.length == 2){
								res.render('one_player', { totalCards: thisDeck.totalCards, 
									showDeck: true, 
									players: thisDeck.players, 
									message: t.name, 
									table_code: t._id.toString(), 
									showMessage: true,
									dealer: thisDeck.players[0],
									first_player: thisDeck.players[1],
									cardSpot: thisDeck.cardSpot,
									betSpot: thisDeck.betSpot,
									showUser: true,
									user: user.username,
									ID: req.session.passport.user
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
									second_player: thisDeck.players[2],
									cardSpot: thisDeck.cardSpot,
									betSpot: thisDeck.betSpot,
									showUser: true,
									user: user.username,
									ID: req.session.passport.user
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
									third_player: thisDeck.players[3],
									cardSpot: thisDeck.cardSpot,
									betSpot: thisDeck.betSpot,
									showUser: true,
									user: user.username,
									ID: req.session.passport.user
								});
							}
						});
					});
				}
				else{
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
								first_player: thisDeck.players[1],
								cardSpot: thisDeck.cardSpot,
								betSpot: thisDeck.betSpot
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
								second_player: thisDeck.players[2],
								cardSpot: thisDeck.cardSpot,
								betSpot: thisDeck.betSpot
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
								third_player: thisDeck.players[3],
								cardSpot: thisDeck.cardSpot,
								betSpot: thisDeck.betSpot
							});
						}
					});
				}		
			}
		});
	});
	

	app.get('/double_down/:table_code', function(req, res){
		Table.findOne({ _id: req.params.table_code }).exec(function(err, t){
			if (!err){
					var thisDeck = parseAndSetProto(table.players);
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