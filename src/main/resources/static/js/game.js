function displayCurrentPeers(id, connectionState) {
    var movesElement = document.getElementById("movesRow");
    removeAllChildren(movesElement);

    movesElement.appendChild(createLoadingPeerWithIcon("YOU", 100));
    Object.keys(connectionState).forEach( function(conn) {
        var state = connectionState[conn].state;
        var loadPercentage = 0;
        var peerId;

        if( id == connectionState[conn].initiator ) {
            peerId = connectionState[conn].acceptor;

            switch(state) {
                case undefined: loadPercentage=0; break;
                case "WAITING_FOR_ANSWER": loadPercentage=50; break;
                case "WAITING_FOR_ANSWER_CANDIDATES": loadPercentage=75; break;
                case "READY_INITIATOR": loadPercentage=100; break;
            }
        } else {
            peerId = connectionState[conn].initiator;

            switch(state) {
                case undefined: loadPercentage=0; break;
                case "WAITING_FOR_OFFER": loadPercentage=25; break;
                case "WAITING_FOR_OFFER_CANDIDATES": loadPercentage=75; break;
                case "READY_ACCEPTOR": loadPercentage=100; break;
            }
        }

        movesElement.appendChild(createLoadingPeerWithIcon(peerId, loadPercentage));
    });
}

function displayCurrentMoves(curMove, trumpSuit) {
    var movesElement = document.getElementById("movesRow");
    removeAllChildren(movesElement);

    for( index=0; index<orderedPeers.length; index++ ) {
        var cardIndex = (selfOrder+index)%orderedPeers.length;

        var peerName = "YOU";
        if( index != 0 ) {
            peerName = orderedPeers[cardIndex].id;
        }

        if( curMove.cards[cardIndex] == undefined ) {
            movesElement.appendChild(createPeerWithIcon(peerName, curMove.waiting == cardIndex));
        } else {
            movesElement.appendChild(createPeerWithCard(peerName, curMove.cards[cardIndex], trumpSuit));
        }
    }
}

function createPeerIconElement() {
    var element = createDivWithClass("peer-icon");
    element.innerHTML = "<svg version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" width=\"250px\" height=\"250px\" viewBox=\"0 0 438.529 438.529\"><g><g><path style=\"fill:#ccc;\" d=\"M219.265,219.267c30.271,0,56.108-10.71,77.518-32.121c21.412-21.411,32.12-47.248,32.12-77.515         c0-30.262-10.708-56.1-32.12-77.516C275.366,10.705,249.528,0,219.265,0S163.16,10.705,141.75,32.115           c-21.414,21.416-32.121,47.253-32.121,77.516c0,30.267,10.707,56.104,32.121,77.515            C163.166,208.557,189.001,219.267,219.265,219.267z\"/>        <path style=\"fill:#ccc;\" d=\"M419.258,335.036c-0.668-9.609-2.002-19.985-3.997-31.121c-1.999-11.136-4.524-21.457-7.57-30.978         c-3.046-9.514-7.139-18.794-12.278-27.836c-5.137-9.041-11.037-16.748-17.703-23.127c-6.666-6.377-14.801-11.465-24.406-15.271          c-9.617-3.805-20.229-5.711-31.84-5.711c-1.711,0-5.709,2.046-11.991,6.139c-6.276,4.093-13.367,8.662-21.266,13.708            c-7.898,5.037-18.182,9.609-30.834,13.695c-12.658,4.093-25.361,6.14-38.118,6.14c-12.752,0-25.456-2.047-38.112-6.14           c-12.655-4.086-22.936-8.658-30.835-13.695c-7.898-5.046-14.987-9.614-21.267-13.708c-6.283-4.093-10.278-6.139-11.991-6.139            c-11.61,0-22.222,1.906-31.833,5.711c-9.613,3.806-17.749,8.898-24.412,15.271c-6.661,6.379-12.562,14.086-17.699,23.127            c-5.137,9.042-9.229,18.326-12.275,27.836c-3.045,9.521-5.568,19.842-7.566,30.978c-2,11.136-3.332,21.505-3.999,31.121         c-0.666,9.616-0.998,19.466-0.998,29.554c0,22.836,6.949,40.875,20.842,54.104c13.896,13.224,32.36,19.835,55.39,19.835h249.533         c23.028,0,41.49-6.611,55.388-19.835c13.901-13.229,20.845-31.265,20.845-54.104C420.264,354.502,419.932,344.652,419.258,335.036           z\"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
    return element;
}

function createLoadingPeerWithIcon(peerName, percentage) {
    var loaderClass;
    if( percentage < 25 ) {
        loaderClass = "load-0";
    } else if( percentage < 50 ) {
        loaderClass = "load-25";
    } else if( percentage < 75 ) {
        loaderClass = "load-50";
    } else if( percentage < 100 ) {
        loaderClass = "load-75";
    } else {
        loaderClass = "load-100";
    }

    var peerElement = createDivWithClass("peer");
    peerElement.appendChild(createPeerIconElement());
    peerElement.appendChild(createDivWithClassAndText("peer-name", peerName));
    peerElement.appendChild(createDivWithClass("peer-loader " + loaderClass));
    return peerElement;
}

function createPeerWithIcon(peerName, waiting) {
    var peerClasses = waiting ? "peer peer-waiting" : "peer";
    var peerElement = createDivWithClass(peerClasses);
    peerElement.appendChild(createPeerIconElement());
    peerElement.appendChild(createDivWithClassAndText("peer-name", peerName));
    return peerElement;
}

function createPeerWithCard(peerName, card, trumpSuit) {
    var peerCardClasses = "peer-card-face";
    var suit = card[card.length-1];

    if( suit == trumpSuit ) {
        peerCardClasses += " peer-card-trump";
    } else {
        switch(suit) {
            case "♣":
            case "♠": peerCardClasses += " peer-card-black"; break;
            case "♥":
            case "♦": peerCardClasses += " peer-card-red"; break;
        }
    }

    var peerCardElement = createDivWithClass("peer-card");
    peerCardElement.appendChild(createDivWithClassAndText(peerCardClasses, card));

    var peerElement = createDivWithClass("peer peer-moved");
    peerElement.appendChild(createPeerIconElement());
    peerElement.appendChild(peerCardElement);
    peerElement.appendChild(createDivWithClassAndText("peer-name", peerName));
    return peerElement;
}

function displayCurrentBets(peerBets, waitingIndex) {
    var movesElement = document.getElementById("movesRow");
    removeAllChildren(movesElement);

    var highest = checkHighestBet(peerBets).peer;

    for( index=0; index<orderedPeers.length; index++ ) {
        var betIndex = (selfOrder+index)%orderedPeers.length;

        var peerName = "YOU";
        if( index != 0 ) {
            peerName = orderedPeers[betIndex].id;
        }

        var waiting = waitingIndex != undefined && waitingIndex == betIndex;
        var top = highest == undefined ? undefined : highest == betIndex;
        var betPeerElement = createPeerWithBet(peerName, waiting, top, peerBets[betIndex].passedBet, peerBets[betIndex].betAmount);
        movesElement.appendChild(betPeerElement);
    }
}


function createPeerWithBet(peerName, waiting, top, passedBet, betAmount) {
    var peerClasses = "peer";

    if( top != undefined ) {
        if( top ) {
            peerClasses += " peer-top";
        } else {
            peerClasses += " peer-low";
        }
    }

    if( waiting ) {
        peerClasses += " peer-waiting";
    }

    var peerCardElement = createDivWithClass("peer-card");

    if( passedBet ) {
        peerClasses += " peer-passed";
        peerCardElement.appendChild(createDivWithClassAndText("peer-passed-face", "🛇"));
    } else {
        peerCardElement.appendChild(createDivWithClassAndText("peer-bet-face", betAmount));
    }

    var peerElement = createDivWithClass(peerClasses);
    peerElement.appendChild(createPeerIconElement());
    peerElement.appendChild(peerCardElement);
    peerElement.appendChild(createDivWithClassAndText("peer-name", peerName));
    return peerElement;
}





function displayCardsForPlayer(cards, uiDisabled, onclickDisabled, trumpSuit, firstSuit) {
    var cardsElement = document.getElementById("cardsRow");
    removeAllChildren(cardsElement);

    var firstSuitPresent = firstSuit == undefined ? false : hasFirstSuit(cards, firstSuit);
    cards.forEach( function(card, index) {

        var suit = card[card.length-1];
        var cardElement;
        if( firstSuit == undefined ) {
            cardElement = createCardElement(card, uiDisabled, trumpSuit);

            if( !onclickDisabled ) {
                cardElement.setAttribute("onclick", "move('" + card + "');")
            }
        } else {
            if( !firstSuitPresent || (firstSuitPresent && suit == firstSuit) ) {
                cardElement = createCardElement(card, uiDisabled, trumpSuit);

                if( !onclickDisabled ) {
                    cardElement.setAttribute("onclick", "move('" + card + "');")
                }
            } else {
                cardElement = createCardElement(card, true, trumpSuit);
            }
        }

        cardsElement.appendChild(cardElement);
    });
}

function hasFirstSuit(cards, firstSuit) {
    var hasSuit = false;

    cards.forEach( function(card) {
        if( !hasSuit && card[card.length-1] == firstSuit ) {
            hasSuit = true;
        }
    });

    return hasSuit;
}

function removeAllChildren(element) {
    while( element.hasChildNodes() ) {
        element.removeChild(element.lastChild);
    }
}

function createCardElement(card, uiDisabled, trumpSuit) {
    var face = card[0];
    var suit = card[card.length-1];

    var faceElement = createDivWithClassAndText("face", face);
    var suitElement = createDivWithClassAndText("suit", suit);

    var cardClasses = "card";
    switch(suit) {
        case "♠": cardClasses += " card-spades"; break;
        case "♥": cardClasses += " card-hearts"; break;
        case "♦": cardClasses += " card-diamonds"; break;
        case "♣": cardClasses += " card-clubs"; break;
    }

    if( trumpSuit != undefined && trumpSuit == suit ) {
        cardClasses += " card-trump";
    }

    if( uiDisabled ) {
        cardClasses += " card-disabled";
    }

    var cardElement = createDivWithClass(cardClasses);
    cardElement.appendChild(faceElement);
    cardElement.appendChild(suitElement);

    return cardElement;
}

function createDivWithClass(classes) {
    return createDivWithClassAndText(classes);
}

function createDivWithClassAndText(classes, text) {
    return createElementWithClassAndText("div", classes, text);
}

function createElementWithClassAndText(tag, classes, text) {
    var elem = document.createElement(tag);
    elem.setAttribute("class", classes);

    if( text != undefined ) {
        var textNode = document.createTextNode(text);
        elem.appendChild(textNode);
    }

    return elem;
}

function wrapElementInDiv(divClasses, element) {
    var divElement = createDivWithClass(divClasses);
    divElement.appendChild(element);
    return divElement;
}

function showElementById(elemId) {
    showElement(document.getElementById(elemId));
}

function hideElementById(elemId) {
    hideElement(document.getElementById(elemId));
}

function showElementByClassName(elemClass) {
    var elements = document.getElementsByClassName(elemClass);
    for( i=0; i<elements.length; i++) { showElement(elements[i]); }
}

function hideElementByClassName(elemClass) {
    var elements = document.getElementsByClassName(elemClass);
    for( i=0; i<elements.length; i++) { hideElement(elements[i]); }
}

function showElement(elem) {
    if( elem.style.display == "none" ) {
        elem.style.display = "";
    }
}

function hideElement(elem) {
    if( elem.style.display != "none" ) {
        elem.style.display = "none";
    }
}

function displayPastMoves(moves, trumpSuit) {
    if( moves.length == 1) {
        return;
    }

    var movesElement = document.getElementById("pastMovesRow");
    showElement(movesElement);
    removeAllChildren(movesElement);

    var pmHeader = createDivWithClass("header-pm");
    pmHeader.appendChild(createElementWithClassAndText("h1", "", "SCORES"));
    movesElement.appendChild(pmHeader);

    var playerNameElement = createDivWithClass("move-pm");
    orderedPeers.forEach( function(peer, index) {
        if( index == selfOrder ) {
            playerNameElement.appendChild(wrapElementInDiv("pm-toprow", createElementWithClassAndText("h2", "", "YOU")));
        } else {
            playerNameElement.appendChild(wrapElementInDiv("pm-toprow", createElementWithClassAndText("h2", "", peer.id)));
        }
    });
    playerNameElement.appendChild(wrapElementInDiv("pm-toprow", createElementWithClassAndText("h2", "", "Winner Score")));
    movesElement.appendChild(playerNameElement);

    var scores = [0, 0, 0, 0]
    moves.forEach( function(move, index) {
        if( index == moves.length-1 ) {
            // don't process current moves
            return;
        }

        var moveElement = createPastMovesElement(move, trumpSuit);
        var scoreElement = createDivWithClassAndText("score-card", move.score)
        scores[move.winner] += move.score;
        moveElement.appendChild(scoreElement);

        movesElement.appendChild(moveElement);
    });

    var moveScoreElement = createDivWithClass("move-pm");
    scores.forEach( function(score) {
        moveScoreElement.appendChild( createDivWithClassAndText("score-card", score) );
    });
    movesElement.appendChild(moveScoreElement);
}

function createPastMovesElement(move, trumpSuit) {
    var moveElement = createDivWithClass("move-pm");
    move.cards.forEach( function(card, cardIndex) {
        var cardElement = createCardElement(card, false, trumpSuit);

        if( move.winner == cardIndex ) {
            cardElement.className += " card-winner";
        }
        cardElement.setAttribute("style", "cursor:default;")
        moveElement.appendChild(cardElement);
    });

    return moveElement;
}

function updateStatusText(msg) {
    document.getElementById("statusText").textContent = msg;
}

function waiting_players(numWaiting) {
    if( numWaiting == 0 ) {
        updateStatusText("Connecting all players");
    } else if( numWaiting == 1 ) {
        updateStatusText("Waiting for 1 more player");
    } else {
        updateStatusText("Waiting for " + numWaiting + " more players");
    }
}

function waiting_bets(currentBetAmount, cards, waitingIndex) {
    showElementById("cardsDiv");
    displayCardsForPlayerBeforeMoves(cards, false, true);
    displayCurrentBets(peerBets, waitingIndex);

    var passedBet = peerBets[selfOrder] == undefined ? false : peerBets[selfOrder].passedBet;
    if( !passedBet && waitingIndex == selfOrder ) {
        updateStatusText("Your turn to bet");
        document.getElementById("betAmount").textContent = (currentBetAmount + 5);
        showElementByClassName("betButtons");
    } else {
        updateStatusText("Waiting for bets");
        hideElementByClassName("betButtons");
    }
}

function waiting_trump(myTurn, cards) {
    hideElementByClassName("betButtons");
    updateStatusText("Waiting for trump");

    if( myTurn ) {
        updateStatusText("Choose trump");
        showElementByClassName("trumpButtons");
        displayCardsForPlayerBeforeMoves(cards, true, true);
    }
}

function displayCardsForPlayerBeforeMoves(cards, uiDisabled, onclickDisabled) {
    displayCardsForPlayer(cards,  uiDisabled, onclickDisabled);
}

function waiting_winner_move(cards, moves) {
    hideElementByClassName("betButtons");
    hideElementByClassName("trumpButtons");

    var curMove = moves[moves.length-1];
    displayCurrentMoves(curMove, trumpSuit);
    displayPastMoves(moves, trumpSuit);

    var isMyTurn = curMove.waiting == selfOrder;

    var firstMove = curMove.cards[curMove.firstMove];
    var firstSuit = firstMove == undefined ? undefined : firstMove[firstMove.length-1];
    displayCardsForPlayer(cards, !isMyTurn, !isMyTurn, trumpSuit, firstSuit);

    if( isMyTurn ) {
        if( curMove.firstMove == selfOrder ) {
            updateStatusText("You won! Your turn to move");
        } else {
            updateStatusText("Your turn to move");
        }
    } else {
        updateStatusText("Waiting for other's turn");
    }
}

function displayEndGame(moves) {
    moves.push({ cards: [] });

    hideElementById("cardsDiv");
    var statusElem = document.getElementById("status-wrap");
    statusElem.className = statusElem.className.replace("with-action", "");

    var curMove = moves[moves.length-1];
    displayCurrentMoves(curMove, trumpSuit);
    displayPastMoves(moves, trumpSuit);
}
