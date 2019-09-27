function displayCurrentMoves(curMove) {
    cards = curMove.cards;
    moveshtml = "";
    cards.forEach( function(e, i) {
        if( e == null ) {
            moveshtml = moveshtml + "<div class=\"card\"><h2>-</h2><p>Player " + (i+1) + "</div>";
        } else {
            moveshtml = moveshtml + "<div class=\"card\"><h2>" + e + "</h2><p>Player " + (i+1) + "</div>";
        }
    });
    $("#movesRow").html(moveshtml);
}

function displayCardsForPlayer(cards, isDisabled) {
    cardshtml = "";
    cards.forEach( function(e, i) {
        if( isDisabled ) {
            cardshtml = cardshtml + "<div class=\"card card-disabled\"><h2>" + e + "</h2></div>";
        } else {
            cardshtml = cardshtml + "<div class=\"card\" onclick=\"move(this);\"><h2>" + e + "</h2></div>";
        }
    });
    $("#cardsRow").html(cardshtml);
}

function displayPastMoves(moves) {
    moveshtml = "";
    moves.forEach( function(e, i) {
        if( i == moves.length-1 ) {
            return;
        }

        $("#pastMovesText").show();
        moveshtml += "<div class=\"col-md-12 pastMovesRow\">";
        e.cards.forEach( function( ce, ci) {
            moveshtml += "<div class=\"card ";
            if( e.winner == ci ) {
                moveshtml += "winner";
            }
            moveshtml += "\"><h2>" + ce + "</h2><p>Player "+ (ci+1) +"</div>";
        });
        moveshtml += "</div>";
    });

    $("#pastMovesRowHolder").html(moveshtml);
}

function updateStatusText(msg) {
    $("#statusText").text(msg);
}

function waiting_players(numWaiting) {
    if( numWaiting == 0 ) {
        $("#statusText").text("Connecting all players");
    } else if( numWaiting == 1 ) {
        $("#statusText").text("Waiting for 1 more player");
    } else {
        $("#statusText").text("Waiting for " + numWaiting + " more players");
    }
}

function waiting_bets(currentBetAmount, cards, bettingTurn, passedBet) {
    $(".bets").show();
    $("#highestBid").text(currentBetAmount);
    $("#betSlider").attr("min", currentBetAmount + 5);
    $("#betAmount").text(currentBetAmount + 5);

    $("#cardsRow").show();
    $("#cardsText").show();
    displayCardsForPlayer(cards, true);

    if( !bettingTurn || passedBet) {
        $("#statusText").text("Waiting for bets");
        $("#betButton").attr("disabled", true);
        $("#passBetButton").attr("disabled", true);
    } else {
        $("#statusText").text("Your turn to bet");
        $("#betButton").attr("disabled", false);
        $("#passBetButton").attr("disabled", false);
    }
}

function waiting_trump(myTurn, cards) {
    $(".bets").hide();
    $("#statusText").text("Waiting for trump");

    if( myTurn ) {
        $(".trump").show();
        $("#cardsRow").show();
        $("#cardsText").show();
        displayCardsForPlayer(cards, true);
    }
}

function waiting_winner_move(cards, moves, isWinner, isMyTurn) {
    $(".bets").hide();
    $(".trump").hide();
    $(".moves").show();

    displayCurrentMoves(moves[moves.length-1]);
    displayPastMoves(moves);

    $("#cardsRow").show();
    $("#cardsText").show();

    if( isMyTurn ) {
        displayCardsForPlayer(cards, false);

        if( isWinner ) {
            $("#statusText").text("You won! Your turn to move");
        } else {
            $("#statusText").text("Your turn to move");
        }
    } else {
        $("#statusText").text("Waiting for other's turn");
        displayCardsForPlayer(cards, true);
    }
}
