var deck_of_cards = new Blackjack();
function Blackjack(){
	this.topCard = undefined;
	this.bottomCard = undefined;
	this.totalCards = 0;
	this.players = [
		{dealer: [],
		 name: "dealer",
		 handsValue: 0
		}
	];
	this.firstDeal = true;
	this.playerTotal = 1;
	this.cardSpot = 1;
	this.betSpot = 1;
}

Blackjack.prototype.resetGame = function(){
	deck_of_cards = new Blackjack();
	this.playerTotal = 1;
	this.cardSpot = 1;
	this.betSpot = 1;
}

Blackjack.prototype.shuffle = function(){
	var set_of_cards = [];
	var set_of_suits = ['clubs','hearts','spades','diamonds'];
	for (var i = 2; i < 15; i++){
		for (var suit = 0; suit < 4; suit++){
			if (i == 11){
				set_of_cards.push("Jack " + set_of_suits[suit] + ",10");
			}
			else if (i == 12){
				set_of_cards.push("Queen " + set_of_suits[suit] + ",10");
			}
			else if (i == 13){
				set_of_cards.push("King " + set_of_suits[suit] + ",10");
			}
			else if (i == 14){
				set_of_cards.push("Ace " + set_of_suits[suit] + ",11");
			}
			else{
				set_of_cards.push(i + " " + set_of_suits[suit] + "," + i);
			}
		}
	}
	console.log(set_of_cards.length);
	var alreadyUsed = [];
	for (var i = 0; i < set_of_cards.length; i++){
		var whichCard = Math.floor((Math.random() * 52) + 1);
		if (alreadyUsed.length == 0){
			alreadyUsed.push(whichCard - 1);
			this.addToDeck(set_of_cards[whichCard - 1]);
		}
		else{
			for (var x = 0; x < alreadyUsed.length; x++){
				if ((whichCard - 1) == alreadyUsed[x]){
					whichCard = Math.floor((Math.random() * 52) + 1);
					x = 0;
				}
			}
			alreadyUsed.push(whichCard - 1);
			this.addToDeck(set_of_cards[whichCard - 1]);
		}
	}

}

Blackjack.prototype.addToDeck = function(val){
	var splitCard = val.split(",");
	console.log(val);
	if (typeof this.topCard == "undefined" && typeof this.bottomCard == "undefined"){
		this.topCard = new Card(splitCard[0], splitCard[1]);
		this.bottomCard = this.topCard;
		this.totalCards++;
	}
	else{
		var previousCard = this.bottomCard;
		this.bottomCard = new Card(splitCard[0], splitCard[1]);
		previousCard.nextCard = this.bottomCard;
		this.totalCards++;
	}
}

function Card(val, numVal){
	this.faceValue = val;
	this.numericalValue = numVal;
	this.nextCard = null;
}

Blackjack.prototype.dealCard = function(){
	if (typeof this.topCard == "undefined"){
		console.log("There are no cards in the deck");
		return "There are no cards in the deck";
	}
	else{
	    var currentCardObj = this.topCard;
		var currentCard = this.topCard.faceValue;
		var currentCardVal = this.topCard.numericalValue;
		if (this.topCard.nextCard == null){
			this.topCard = undefined;
			this.bottomCard = undefined;
		}
		else{
			this.topCard = this.topCard.nextCard;
			this.totalCards--;
		}
		console.log(currentCard + " " + currentCardVal);
		currentCardObj.nextCard = null;
		return currentCardObj;
	}
}


Blackjack.prototype.tallyHandValue = function(playerNum){
    var playerArraySpot;
    if (playerNum == "dealer"){
        playerArraySpot = 0;
    }
    else{
        playerArraySpot = playerNum;
    }
	var cardCount = this.players[playerArraySpot][playerNum].length;
	var handValue = 0;
	var aces = 0;
	for (var i = 0; i < cardCount; i++){
		if (this.players[playerArraySpot][playerNum][i].numericalValue == 11){
			aces++;
		}
		handValue += Number(this.players[playerArraySpot][playerNum][i].numericalValue);
	}
	this.players[playerArraySpot].handsValue = handValue;
	while (aces > 0 && this.players[playerArraySpot].handsValue > 21){
		aces--;
		this.players[playerArraySpot].handsValue -= 10;
	}
}

Blackjack.prototype.findNextPlayer = function(currentPlayer){
	do { if (this.cardSpot >= this.players.length - 1){
				this.cardSpot = 0;
				currentPlayer = 0;
				while (this.players[0].handsValue < 17){
					this.assignCard();
				}
				this.endHand();
			}
		else{
			this.cardSpot++;
		 	currentPlayer++; 
		} 
	}
	while (this.players[currentPlayer].hasHold === true)
}

Blackjack.prototype.endHand = function(){
    for (var i = 1; i < this.players.length; i++){
        if (this.players[i].handsValue > this.players[0].handsValue && this.players[i].handsValue <= 21 || (this.players[0].handsValue > 21 && this.players[i].handsValue <= 21)){
            this.players[i].funds += (this.players[i].bet * 2);
        }
        else if (this.players[i].handsValue == this.players[0].handsValue && this.players[i].handsValue <= 21){
            this.players[i].funds += this.players[i].bet;
        }
        else{
            if (this.players[i].funds <= 0){
                console.log(this.players[i].name + " has played his/her last hand");
            }
        }
        this.players[i][i] = [];
        this.players[i].bet = 0;
        this.players[i].hasHold = false;
        this.players[i].handsValue = 0;
    }
    this.players[0]["dealer"] = [];
    this.players[0].handsValue = 0;
    this.firstDeal = true;
    this.betSpot = 1;
    this.cardSpot = 1;
    if (this.totalCards < (this.players.length * 4)){
        this.topCard = undefined;
        this.bottomCard = undefined;
        this.totalCards = 0;
        this.shuffle();
    }
}

Blackjack.prototype.assignCard = function(){
	var playerCount = this.players.length;
	if (this.firstDeal){
		for (var i = 1; i <= playerCount; i++){
		    if (i == playerCount){
		        var x = "dealer";
		        this.players[0][x].push(this.dealCard());
		    }
		    else{
		        this.players[i][i].push(this.dealCard());    
		    }
		    
		}
		for (var y = 1; y <= playerCount; y++){
		    if (y == playerCount){
		        var z = "dealer";
		        this.players[0][z].push(this.dealCard());
		        this.tallyHandValue("dealer");
		        if (this.players[0].handsValue == 21){
		            this.endHand();
		        }
		    }
		    else{
		    this.players[y][y].push(this.dealCard());
		    this.tallyHandValue(y); 
		    }
		    
		}
		this.firstDeal = false;	
	}
	else{
		if (this.cardSpot > 0){
			this.players[this.cardSpot][this.cardSpot].push(this.dealCard());
			this.tallyHandValue(this.cardSpot);
			if (this.players[this.cardSpot].handsValue > 21){
			    this.hold();
			}
		}
		else{
			this.players[0]["dealer"].push(this.dealCard());
			this.tallyHandValue("dealer");
		}
	}
}

Blackjack.prototype.hold = function(){
	this.players[this.cardSpot].hasHold = true;
	this.findNextPlayer(this.cardSpot);
}

Blackjack.prototype.addPlayer = function(playerName){
	var playerObject = new Player(this.playerTotal, playerName)
	this.players.push(playerObject);
	this.playerTotal++;
}

Blackjack.prototype.placeBet = function(val){
    if (this.betSpot >= this.players.length){
        return "Everyone has placed their bets";
    }
    else{
        if (this.players[this.betSpot].funds - val >= 0){
            this.players[this.betSpot].bet = val;
            this.players[this.betSpot].funds -= val; 
            this.betSpot++;
        }
        else{
            return "You do not have enough funds available";
        }    
    }
}

Blackjack.prototype.doubleDown = function(){
    if (this.players[this.cardSpot].funds < this.players[this.cardSpot].bet){
        return "You dont have enough to double down";
    }
    else{
        this.players[this.cardSpot].funds -= this.players[this.cardSpot].bet;
        this.players[this.cardSpot].bet *= 2;
        var checkCardSpot = this.cardSpot;
        this.assignCard();
        if (checkCardSpot == this.cardSpot){
            this.hold();
        }    
    }
}

function Player(playerNum, playerName){
	this[playerNum] = [];
	this.name = playerName;
	this.hasHold = false;
	this.handsValue = 0;
	this.funds = 100;
	this.bet = 0;
}

var newBlackjack = function(){
	var i = new Blackjack();
	return i;
};
	
var newCard = function(){
	var i = new Card();
	return i;
};
var newPlayer = function(){
	var i = new Player();
	return i;
};
module.exports = { Blackjack: newBlackjack, Card: newCard, Player: newPlayer }
