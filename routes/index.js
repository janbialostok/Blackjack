//AES encoding cant be used because of special characters
//AES encoding returns and object that contains key iv salt and ciphertext properties
//new_table.table_code = aes.encrypt(new_table.name, new_table.name);
//console.log(aes.decrypt(new_table.table_code, new_table.name));
/*Example of a encryption and decryption of a sample password/passphrase
var encrypted = aes.encrypt("Message", "Secret Passphrase");
console.log(encrypted);
var decrypted = aes.decrypt(encrypted, "Secret Passphrase");
console.log(decrypted.toString(crypto.enc.Utf8));*/

var aes = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var crypto = require("crypto-js");
var deck = require('../blackjack');
var Table = require("../models").Table;
var User = require("../models").User;
module.exports = function(app, io){

	var deck_of_cards = deck.Blackjack();
	// app.get('/', function(req, res){
	// 	console.log(deck_of_cards);
	// 	res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true });
	// });
	
	app.get('/', function(req, res){
		Table.find().exec(function(err, tables){
			if (!err && tables.length != 0){
				res.render('landing', { message: "Available Tables", tables: tables, showTableList: true });		
			}
			else{
				res.render('landing', { message: "There are no available tables, start one above" });
			}
		});
	});

	app.post('/table/init', function(req, res){
		if (req.body.create_table == null || req.body.create_table == ""){
			res.redirect('/');
		}
		else{
			res.render('tables', { table_name: req.body.create_table, message: "Create New Table" });
		}
	});

	app.post('/table/submit', function(req, res){
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
		new_table = new Table({name: req.body.new_table_name,  players: deck_of_cards });
		new_table.table_code = SHA256(new_table.name);
		new_table.url = new_table.name.replace(/[\W\s]/g, '_');
		new_table.save(function(err, table){
			res.redirect(table.url_route);	
		});
	});

	app.get('/games/:table_code/:url', function(req, res){
		Table.findOne({ table_code: req.params.table_code, url: req.params.url }).exec(function(err, t){
			if (!err){
				res.render('index', { totalCards: t.players.totalCards, showDeck: true, players: t.players.players, message: "Welcome to table " + t.name });
			}
			else{
				res.redirect('/');
			}
		});
	});

	app.get('/start', function(req, res){
		deck_of_cards.shuffle();
		console.log(deck_of_cards);
		var new_table = new Table({})
		res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, players: deck_of_cards.players });
	});

	app.get('/player/:name', function(req, res){
		deck_of_cards.addPlayer(req.params.name);
		console.log(deck_of_cards);
		res.render('index', {  totalCards: deck_of_cards.totalCards, showDeck: true, showMessage: true, message: "Welcome, " + req.params.name });
	});

	app.get('/deal', function(req, res){
		var betsIn = true;
		deck_of_cards.players.forEach(function(player){
			if (player.name != "dealer"){
				if (player.bet == 0){
					betsIn = false;
				}
			}
		});
		if (!betsIn){
			res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, showMessage: true, message: "Please make sure all players have placed bets!", players: deck_of_cards.players });
		}
		else{
			deck_of_cards.assignCard();
			res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, players: deck_of_cards.players });
		}
	});

	app.get('/placebet/:value', function(req, res){
		deck_of_cards.placeBet(req.params.value);
		res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, players: deck_of_cards.players });
	});

	app.get('/hold', function(req, res){
		deck_of_cards.hold();
		res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, players: deck_of_cards.players });
	});

	app.get('/reset', function(req, res){
		Table.remove({}).exec(function(err){
			res.redirect('/');
		});
	});

	app.get('/double_down', function(req, res){
		deck_of_cards.doubleDown();
		res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, players: deck_of_cards.players });
	});

}