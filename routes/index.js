var deck = require('../blackjack');
module.exports = function(app, io){

	var deck_of_cards = deck.Blackjack();

	app.get('/', function(req, res){
		console.log(deck_of_cards);
		res.send("Deck currently has " + deck_of_cards.totalCards + " cards");
	});

	app.get('/start', function(req, res){
		deck_of_cards.shuffle();
		console.log(deck_of_cards);
		res.send("Deck currently has " + deck_of_cards.totalCards + " cards");
	});

	app.get('/player/:name', function(req, res){
		deck_of_cards.addPlayer(req.params.name);
		console.log(deck_of_cards);
		res.send("Deck currently has " + deck_of_cards.totalCards + " cards Hi, " + req.params.name + " welcome to the game");
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
			res.send("Please make sure all players have placed bets!");
		}
		else{
			deck_of_cards.assignCard();
			console.log(deck_of_cards.players[cardSpot]);
			res.redirect('/');
		}
	})

}