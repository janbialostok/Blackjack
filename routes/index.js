var deck = require('../blackjack');
module.exports = function(app, io){

	var deck_of_cards = deck.Blackjack();

	app.get('/', function(req, res){
		console.log(deck_of_cards);
		res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true });
	});

	app.get('/start', function(req, res){
		deck_of_cards.shuffle();
		console.log(deck_of_cards);
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
		deck_of_cards = deck.Blackjack();
		res.redirect('/')
	});

	app.get('/double_down', function(req, res){
		deck_of_cards.doubleDown();
		res.render('index', { totalCards: deck_of_cards.totalCards, showDeck: true, players: deck_of_cards.players });
	});

}