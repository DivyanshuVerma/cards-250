var localstore = window.localStorage;
var partyName = localstore.getItem("partyName");
var peerId = localstore.getItem("peerId");
var serverPollingId;
var peerPollingId;

var connAPI = "/party/" + partyName + "/peer/" + peerId + "/connections";

function checkConnections() {
    $.get( connAPI, function(data) {
        var partyFull = processConnections(partyName, peerId, data);

        if( partyFull ) {
            processPeers();
        } else {
            waiting_players( 3 - Object.keys(connectionState).length );
         }
    });
}

var orderedPeers = [];
var selfOrder;
var shuffleKey;
var packKeys = [];

var faces = ["5", "7", "8", "9", "T", "J", "Q", "K", "A"];
var suits = ["♠", "♣", "♥", "♦"];
var messageQueue = ["{}"];
var gameState = "SEND_ORDER";
var myCards = [];
var cardKeys = [];
var sentKeys = false;

function processPeers() {
    window.clearInterval(serverPollingId);
    updateStatusText("Ordering players");
    peerPollingId = window.setInterval(checkPeerMessages, 1000);
    console.log("all ready");
}

function checkPeerMessages() {
    if( messageQueue.length > 0 ) {
        var msg = messageQueue.shift();
        processPeerJsonMsg(JSON.parse(msg));
    }
}

function processPeerMessage(event) {
    messageQueue.push(event.data);
}

function sendOrder() {
    selfOrder = calculateOrder( connectionState );
    orderedPeers[selfOrder] = "self";
    broadcastBeforeOrdering( { order: selfOrder, id: peerId } );
    gameState = "WAITING_FOR_ORDER";
}

function processPeerJsonMsg(msg) {
    console.log("processing", msg, ", state", gameState);
    switch ( gameState ) {
        case "SEND_ORDER":
            sendOrder();
            break;
        case "WAITING_FOR_ORDER":
            waiting_order(msg);
            break;
        case "WAITING_FOR_CARDS":
            waiting_cards_encrypt(msg);
            break;
        case "WAITING_FOR_CARDS_TO_DIST":
            waiting_cards_encrypt_each(msg);
            break;
        case "WAITING_FOR_MY_CARDS":
            waiting_my_cards(msg);
            break;
        case "WAITING_FOR_PACK_RECEIVED_MARKER":
            waiting_pack_received_marker();
            break;
        case "WAITING_FOR_KEYS":
            waiting_keys(msg);
            break;
        case "WAITING_PEER_BETS":
            waiting_peer_bets(msg);
            break;
        case "WAITING_FOR_TRUMP":
            waiting_peer_trump(msg);
            break;
        case "WAITING_FOR_WINNER_MOVE":
            waiting_for_peer_winner_move(msg);
            break;
        default:
            console.log("default switch state:", gameState);
    }
}

function waiting_order(msg) {
    var peerOrder = msg.order;
    var otherPeerId = msg.id;
    var dc = getPeerDC(msg.id);

    orderedPeers[ peerOrder ] = { id: otherPeerId, dc: dc };
    if( (orderedPeers[0] && orderedPeers[1] && orderedPeers[2] && orderedPeers[3]) != undefined) {
        if( selfOrder == 0 ) {
            distributeCards();
        } else {
            gameState = "WAITING_FOR_CARDS";
        }
    }
}

function distributeCards() {
    updateStatusText("Creating new pack of cards");

    var pack = createPack();
    console.log("created:", pack);
    pack = convertPackToCharCode(pack);
    console.log("converted to char codes:", pack);
    pack = encryptPackForShuffle(pack);
    console.log("encrypted:", pack);
    shuffle(pack);
    gameState = "WAITING_FOR_CARDS_TO_DIST";
    sendToPeer( selfOrder+1, { encryptedPack: pack } );
    console.log("sent shuffled");
}

function waiting_cards_encrypt(msg) {
    updateStatusText("Shuffling cards");
    console.log("encrypt and shuffle this:", msg);
    var pack = encryptPackForShuffle(msg.encryptedPack);
    console.log("encrypted:", pack);
    shuffle(pack);
    gameState = "WAITING_FOR_CARDS_TO_DIST";
    var nextOrder = (selfOrder + 1)%orderedPeers.length;
    sendToPeer( nextOrder, { encryptedPack: pack } );
    console.log("sent shuffled");
}

function waiting_cards_encrypt_each(msg) {
    updateStatusText("Encrypting cards");
    var encPack = msg.encryptedPack;
    var distPack = encryptPackForDistributing(encPack);
    console.log("distributing", distPack);
    gameState = "WAITING_FOR_MY_CARDS";
    var nextOrder = (selfOrder + 1)%orderedPeers.length;
    sendToPeer( nextOrder, { encryptedPack: distPack } );
    console.log("sent to distribute");
}

function waiting_my_cards(msg) {
    updateStatusText("Waiting for peer encrypted cards");
    console.log("whole pack", msg);
    myCards = msg.encryptedPack;

    if( selfOrder == 0 ) {
        gameState = "WAITING_FOR_PACK_RECEIVED_MARKER";
    } else {
        gameState = "WAITING_FOR_KEYS";
    }

    var nextOrder = (selfOrder + 1)%orderedPeers.length;
    if( selfOrder == 3 ) {
        sendToPeer( nextOrder, { data: "pack_received" } );
        console.log("sent whole pack received marker");
    } else {
        sendToPeer( nextOrder, msg );
        console.log("sent whole pack");
    }
}

function waiting_pack_received_marker() {
    console.log("pack received by all");
    gameState = "WAITING_FOR_KEYS";
    send_keys();
    console.log("sent keys");
}

function send_keys() {
    updateStatusText("Sending card decryption keys");
    var chunks = [];
    var chunkSize = packKeys.length/4;
    for( i=0; i<packKeys.length; i=i+chunkSize ) {
        chunks.push( packKeys.slice(i, i+chunkSize) );
    }

    var startIndex = selfOrder * chunkSize;
    myCards = myCards.slice( startIndex, startIndex+chunkSize);
    console.log("chunked from", startIndex, "to", startIndex+chunkSize);

    for( i=0; i<chunks.length; i++ ) {
        if( selfOrder == i ) {
            cardKeys[i] = chunks[i];
        } else {
            sendToPeer( i, { from: selfOrder, to: i, cardKeys: chunks[i] } );
        }
    }

    sentKeys = true;
}

function waiting_keys(msg) {
    updateStatusText("Waiting for peer's keys");
    console.log("got keys msg", msg);
    cardKeys[msg.from] = msg.cardKeys;

    if( ! sentKeys ) {
        send_keys();
    }

    if( (cardKeys[0] && cardKeys[1] && cardKeys[2] && cardKeys[3]) != undefined ) {
        console.log("process now!");
        decryptOwnPack();
        processCards();
    }
}

function decryptOwnPack() {
    var chunkSize = packKeys.length/4;
    var myConvCards = [];

    for( i=0; i<chunkSize; i++ ) {
        myCards[i][0] = myCards[i][0] ^ cardKeys[0][i] ^ cardKeys[1][i] ^ cardKeys[2][i] ^ cardKeys[3][i];
        myCards[i][1] = myCards[i][1] ^ cardKeys[0][i] ^ cardKeys[1][i] ^ cardKeys[2][i] ^ cardKeys[3][i];
        var card = String.fromCharCode(myCards[i][0]) + String.fromCharCode(myCards[i][1]);
        myConvCards.push(card);
    }

    myCards = myConvCards;
    console.log("decrypted own cards");
}

function processCards() {
    gameState = "WAITING_PEER_BETS";
    if( selfOrder == 0 ) {
        waiting_bets( 160, myCards, true, false );
    } else {
        waiting_bets( 160, myCards, false, false );
    }
}

var peerBets = [{passedBet: false}, {passedBet: false}, {passedBet: false}, {betAmount:160, passedBet: false}];
var trumpSuit;
var trumpWinner;
var moves = [ { cards: [] } ];

function waiting_peer_bets(msg) {
    console.log("got peer bet");
    var from = msg.from;
    peerBets[from] = msg;

    var top = checkHighestBet(peerBets);
    var highestBet = top.bet;
    var highestBetPeer = top.peer;
    var passedBetsCount = checkPassedCount(peerBets);

    if( passedBetsCount == 3 ) {
        gameState = "WAITING_FOR_TRUMP";
        waiting_trump(selfOrder == highestBetPeer, myCards);
    } else {
        var nextOrder = (from+1)%orderedPeers.length;
        if( selfOrder == nextOrder ) {
            waiting_bets( highestBet, myCards, true, peerBets[selfOrder].passedBet );
        } else {
            waiting_bets( highestBet, myCards, false, peerBets[selfOrder].passedBet );
        }
    }
}

function checkHighestBet(bets) {
    var highestBet = 0;
    var highestBetPeer;
    for( i=0; i<bets.length; i++ ) {
        if( bets[i].betAmount != undefined && bets[i].betAmount > highestBet ) {
            highestBet = bets[i].betAmount;
            highestBetPeer = i;
        }
    }

    return { peer: highestBetPeer, bet: highestBet};
}

function checkPassedCount(bets) {
    var passedBetsCount = 0;
    for( i=0; i<bets.length; i++ ) {
        if( bets[i].passedBet ) {
            passedBetsCount++;
        }
    }

    return passedBetsCount;
}

function processBet() {
    var myBet = parseInt($("#betAmount").text());
    peerBets[selfOrder] = { betAmount: myBet, passedBet: false };
    broadcastAfterOrdering( peerBets[selfOrder] );
    waiting_bets( myBet, myCards, false, false );
}

function passBet() {
    peerBets[selfOrder] = { passedBet: true };
    broadcastAfterOrdering( peerBets[selfOrder] );
    $("#betButton").attr("disabled", true);
    $("#passBetButton").attr("disabled", true);

    // check if this is the last pass
    var passedBetsCount = checkPassedCount(peerBets);
    if( passedBetsCount == 3 ) {
        gameState = "WAITING_FOR_TRUMP";

        var top = checkHighestBet(peerBets);
        waiting_trump(selfOrder == top.peer, myCards);
    }
}

function waiting_peer_trump(msg) {
    trumpSuit = msg.trump;
    trumpWinner = msg.from;
    gameState = "WAITING_FOR_WINNER_MOVE";
    waiting_winner_move(myCards, moves, false, false);
}

function setTrump(suit) {
    trumpSuit = suit;
    trumpWinner = selfOrder;
    broadcastAfterOrdering( { trump: suit } );
    gameState = "WAITING_FOR_WINNER_MOVE";
    waiting_winner_move(myCards, moves, true, true);
}

function waiting_for_peer_winner_move(msg) {
    var from = msg.from;
    var card = msg.card;

    var curMoves = moves[ moves.length-1 ];
    var curCards = curMoves.cards;
    curCards[from] = card;

    // check if everyone has moved
    if( (curCards[0] && curCards[1] && curCards[2] && curCards[3]) != undefined ) {
        console.log("Everyone has moved");

        // check winner and it will be his turn
        var firstMove = getPreviousWinner(moves, trumpWinner);
        var stats = getCurrentStats(curCards, firstMove, trumpSuit);
        curMoves.winner = stats.winner;
        curMoves.score = stats.score;

        if( myCards.length == 0 ) {
            var scores = getCumulativeScores(moves);
            console.log(scores);

            var gameWinner = 0;
            var gameScore = scores[0];
            for(i=1; i<scores.length; i++) {
                if( scores[i] > gameScore ) {
                    gameWinner = i;
                    gameScore = scores[i];
                }
            }

            if( selfOrder == gameWinner ) {
                console.log("You won this game!");
                updateStatusText("You won this game with a score of " + gameScore);
            } else {
                console.log("Player", gameWinner, "won this game!");
                updateStatusText("Player", gameWinner, "won this game with a score of " + gameScore);
            }
        } else {
            moves.push({ cards: [] });
            if( selfOrder == curMoves.winner ) {
                console.log("Won this round");
                // update ui
                waiting_winner_move(myCards, moves, true, true);
            } else {
                // other won but update ui
                waiting_winner_move(myCards, moves, false, false);
            }
        }
    } else {
        // check if you have to move
        var nextOrder = (from+1)%orderedPeers.length;
        if( selfOrder == nextOrder ) {
            // my turn, update ui
            waiting_winner_move(myCards, moves, false, true);
        } else {
            waiting_winner_move(myCards, moves, false, false);
        }
    }
}

function move(element) {
    var selectedCard = $($(element).children("h2")[0]).text();

    var curMoves = moves[ moves.length-1 ];
    var curCards = curMoves.cards;
    curCards[selfOrder] = selectedCard;
    broadcastAfterOrdering( { card: selectedCard } );

    // remove card
    var removeIndex = myCards.indexOf(selectedCard);
    myCards.splice(removeIndex, 1);

    // check if everyone has moved
    if( (curCards[0] && curCards[1] && curCards[2] && curCards[3]) != undefined ) {
        console.log("Everyone has moved");

        // check if you are the winner and it will be your turn
        var firstMove = getPreviousWinner(moves, trumpWinner);
        var stats = getCurrentStats(curCards, firstMove, trumpSuit);
        curMoves.winner = stats.winner;
        curMoves.score = stats.score;

        if( myCards.length == 0 ) {
            var scores = getCumulativeScores(moves);
            console.log(scores);

            var gameWinner = 0;
            var gameScore = scores[0];
            for(i=1; i<scores.length; i++) {
                if( scores[i] > gameScore ) {
                    gameWinner = i;
                    gameScore = scores[i];
                }
            }

            if( selfOrder == gameWinner ) {
                console.log("You won this game!");
                updateStatusText("You won this game with a score of " + gameScore);
            } else {
                console.log("Player", gameWinner, "won this game!");
                updateStatusText("Player", gameWinner, "won this game with a score of " + gameScore);
            }
        } else {
            moves.push({ cards: [] });
            if( selfOrder == curMoves.winner ) {
                console.log("won this round");
                // update ui
                waiting_winner_move(myCards, moves, true, true);
            } else {
                waiting_winner_move(myCards, moves, false, false);
            }
        }
    } else {
        // update ui with my move
        waiting_winner_move(myCards, moves, false, false);
    }
}

function getCumulativeScores(moves) {
    var scores = [0, 0, 0, 0];
    for( i=0; i<moves.length; i++) {
        var move = moves[i];
        scores[move.winner] += move.score;
    }

    return scores;
}

function getPreviousWinner(moves, trumpWinner) {
    if (moves.length == 1) {
        return trumpWinner;
    }

    return moves[ moves.length-2 ].winner;
}

function getCurrentStats(cards, firstMove, trumpSuit) {
    // need to define exact logic

    var firstCard = cards[firstMove];
    var firstFace = firstCard[0];
    var firstSuit = firstCard[firstCard.length-1];

    var winnerWeight = getWeight(firstFace, firstSuit, firstSuit, trumpSuit);
    var winnerIndex = firstMove;
    var score = getScore(firstFace, firstSuit);

    for( i=1; i<orderedPeers.length; i++ ) {
        var cardIndex = (i+firstMove)%orderedPeers.length;
        var card = cards[cardIndex];
        var face = card[0];
        var suit = card[card.length-1];

        var cardWeight = getWeight(face, suit, firstSuit, trumpSuit);
        if( cardWeight > winnerWeight ) {
            winnerWeight = cardWeight;
            winnerIndex = cardIndex;
        }

        score += getScore(face, suit);
    }

    return { winner: winnerIndex, score: score };
}

function getWeight(face, suit, firstSuit, trumpSuit) {
    var weight = 0;

    if (suit == trumpSuit) {
        weight += 20;
    } else if (suit == firstSuit) {
        weight += 10;
    }

    switch(face) {
        case "5": weight += 1; break;
        case "7": weight += 2; break;
        case "8": weight += 3; break;
        case "9": weight += 4; break;
        case "T": weight += 5; break;
        case "J": weight += 6; break;
        case "Q": weight += 7; break;
        case "K": weight += 8; break;
        case "A": weight += 9; break;
    }

    return weight;
}

function getScore(face, suit) {
    var score = 0;
    switch(face) {
        case "5": score=5; break;
        case "7": if( suit == "♥" ) score=30; break;
        case "T":
        case "J":
        case "Q":
        case "K":
        case "A": score=10; break;
    }

    return score;
}

function getPeerDC( otherPeerId ) {
    var conns = Object.keys(connectionState);
    for( i=0; i<conns.length; i++ ) {
        if( conns[i].indexOf( otherPeerId ) != -1 ) {
            return connectionState[conns[i]].dc;
        }
    }
}

function sendToPeer(order, msg) {
    orderedPeers[order].dc.send( JSON.stringify(msg) );
}

function broadcastAfterOrdering(msg) {
    msg.from = selfOrder;
    for( i=0; i<orderedPeers.length; i++ ) {
        if( i != selfOrder ) {
            msg.to = i;
            sendToPeer(i, msg);
        }
    }
}

function broadcastBeforeOrdering(msg) {
    var jsonmsg = JSON.stringify(msg);
    Object.keys(connectionState).forEach( function(connection) {
        connectionState[connection].dc.send(jsonmsg);
    });
}

function calculateOrder(connectionState) {
    var numAcceptors = 0;
    Object.keys(connectionState).forEach( function(connection) {
        if( connectionState[connection].state == "READY_ACCEPTOR" ) {
            numAcceptors++;
        }
    });
    return numAcceptors;
}

function createPack() {
    var pack = [];

    faces.forEach( function(face) {
        suits.forEach( function(suit) {
            pack.push( face + suit );
        });
    });

    return pack;
}

function generateKey() {
    return (Math.random() * 10000).toFixed(0);
}

function generateKeys(length) {
    var keys = [];
    for( i=0; i<length; i++ ) {
        keys.push( generateKey() );
    }
    return keys;
}

function convertPackToCharCode(pack) {
    var codedPack = [];
    pack.forEach( function(card) {
        codedPack.push([card.charCodeAt(0), card.charCodeAt(1)]);
    });

    return codedPack;
}

function encryptPackForShuffle(codedPack) {
    var encryptedPack = [];
    shuffleKey = generateKey();

    for( i=0; i<codedPack.length; i++ ) {
        encryptedPack.push( [ codedPack[i][0] ^ shuffleKey, codedPack[i][1] ^ shuffleKey ] );
    }

    return encryptedPack;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function encryptPackForDistributing(shuffledPack) {
    packKeys = generateKeys( shuffledPack.length );

    for( i=0; i<packKeys.length; i++ ) {
        var card = shuffledPack[i];
        shuffledPack[i] = [ card[0] ^ shuffleKey ^ packKeys[i], card[1] ^ shuffleKey ^ packKeys[i] ];
    }

    return shuffledPack;
}

$(document).ready( function() {
    updateStatusText("Checking party");
    serverPollingId = window.setInterval(checkConnections, 2500);
    $('#betSlider').bind('change mousedown mouseup',function(e){
        $("#betAmount").text(e.target.value);
    });
});