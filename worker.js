	/**
		play workflow

		deal round (1 card from each hand)
		compare 
		winner takes all and pushes to hand
		if tie, deal 4 rounds - compare 4th round...

		objects:
		deck - array divided between the players
		inplay - array divided betwen the players
		
		
		table: (current cards in play)


		deck []
		players [{hand}]
			hand [cards...]
		inplay


		data structure generated

		{games:[
			{
			rounds:[
				{
					winner:1,
					played:[[{s:"hearts",v:3}],[{s:"spades",v:10}]]
					close:[22,30]//resulting card count for each player
				},
				{
					winner:1,
					wars:1,
					close:[8,44]//resulting card count for each player
					played:[[{s:"diamonds",v:2},],[{s:"spades",v:2}]],
					
					
				},
			]}
		]}

	**/


//	console.log(deal(2));
	//run the game...
	function play(players){
		//setup the deck
		function makeDeck(){
		var	suites = ["spades","clubs","diamonds","hearts"],
			values = [2,3,4,5,6,7,8,9,10,11,12,13,14],
			deck = [];
				suites.forEach(function(s){
					values.forEach(function(v){
						deck.push({"s":s,"v":v});
					});
				});
			return deck;
		}


		//shuffle
		//Fisher-Yates shuffle c/o Mike Bostock
		function shuffle(array) {
		  var m = array.length, t, i;

		  // While there remain elements to shuffle…
		  while (m) {

		    // Pick a remaining element…
		    i = Math.floor(Math.random() * m--);

		    // And swap it with the current element.
		    t = array[m];
		    array[m] = array[i];
		    array[i] = t;
		  }

		  return array;
		}

		//deal the cards
		function deal(players){
			var hands = [];
			

			var deck = shuffle(makeDeck());
			for (var pl = 0; pl < players; pl++){
				hands.push([]);
			}
			while(deck.length > 0){
				hands.forEach(function(h,i){
						h.push(deck.pop());
				});
			}

			return hands;
		}


		//execute a round...
		function playRound(){
			rounds++;
			var rData = {played:[],count:deck.map(function(d){return d.length;})};
			//take top card from each play and add to current
			function playCards(isWar){

				//return winner or -1 if a tie (war)
				function compare(){
					var victor  = -1,
						index = -1,
						equal = false;
					inplay.forEach(function(cards,i){
						//compare only the last card in each stack
						//if there are no cards in the stack, default to a value of 0
						var c = cards.length > 0 ? cards[cards.length -1]: {v:0};		
						//are cards equal?
						if (victor > -1){
							equal =  c && c.v && c.v === victor;
						}
						
						victor = c && (c.v > victor) ? c.v : victor;
						if ((victor === c.v && victor !== -1)){
							index = i; 
						}

						
					});
					if (equal){
						console.log("war! round = " + rounds)
					}
					//return -1 if they are all equal
					return equal ? -1 : index;
				}
				//reset current
				var limit = isWar ? 4 : 1,
					count = 0,
					wars = 0;

				while (count < limit){
					deck.forEach(function(hand,i){
						if (hand.length > 0){
							inplay[i].push(hand.pop());
						} else {
							//if hand is out, look for discard pile and reshuffle
							
							if (discard[i].length > 0){
								deck[i] = shuffle(discard[i]);
								discard[i] = [];
								inplay[i].push(deck[i].pop());
							}
							
						}
					});
					count++;
				}



				var result = compare();
				if (result > -1){
					rData.win = result;

					//log the played cards for the round
					inplay.forEach(function(ip,i){
						rData.played.push(ip.slice(0));
						
						/*ip.forEach(function(c){
							played[i].push(c);

						});*/

					});

					//put the won cards in the winning player's discard stack
					inplay.forEach(function(cards){
						while (cards.length > 0){
							discard[result].unshift(cards.pop());
						}
					});


					//if at the end of the round, somebody has 0 cards, play is over,
					//if they have cards in their discard pile - reshuffle as new hand
					deck.forEach(function(d,i){
						if (d.length === 0){
							if (discard[i].length === 0){
								playing = false;
							}
							else {
								//console.log("reshuffle");
								deck[i] = shuffle(discard[i]);
								discard[i] = [];
							}
						}
					});
						
				}
				else {

					//war!
					//do all players have more cards?
					deck.forEach(function(h,i){
						if (h.length === 0 && discard[i].length === 0){
							playing = false
						}
					});
					if (playing){
						wars++;
						playCards(true);
					}
				}

				rData.wars = wars;
				return rData;

			}


			return playCards();
			

		}

		
		var deck = deal(players),//deal out cards and initialize the stack of inplay cards
			playing = true,		//flag is true until somebody wins...
			inplay = [], //current cards in play (one array for each player)
			discard = [], 	//each player's discard pile (to be reshuffled when hand is empty)
			rounds = 0,
			roundCount = 1, //count total # of rounds for logging purposes
			data = {rounds:[]}; //data object generated by game play
		//initialize the inplay and discard stacks for each player
		for (var pl = 0; pl < players; pl++){
			inplay.push([]);
			discard.push([]);
		}

		while (playing){
			data.rounds.push(playRound());
			roundCount++;
		}
		//mark winner
		deck.forEach(function(h,i){
			if (h.length > 0){
				data.win = i;
			}
		});
		return data;
	}

	onmessage = function(e){
		console.log("worker - msg recieved")
		postMessage(play(e.data));
	}