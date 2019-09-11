package com.div.cards;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;

@Data
@Slf4j
public class GameStat {

    State state;

    int betAmount = 155;
    String bettingPlayerId;
    boolean[] passedBets;

    Suit trump;

    Player[] players;
    ArrayList<String> playerIds;

    ArrayList<Move> moves;

    GameStat() {
        state = State.INITIALIZING;

        players = new Player[4];
        players[0] = new Player();
        players[1] = new Player();
        players[2] = new Player();
        players[3] = new Player();
        playerIds = new ArrayList<>();

        passedBets = new boolean[]{false, false, false, false};

        Pack p = new Pack();
        p.shuffle();

        int i=0;
        for( Card card : p.getCards()) {
            switch (i%4) {
                case 0: players[0].give(card); break;
                case 1: players[1].give(card); break;
                case 2: players[2].give(card); break;
                case 3: players[3].give(card);
            }
            i++;
        }

        moves = new ArrayList<>();
        Move move = new Move();
        move.previousWinner = 0;
        moves.add(move);

        state = State.WAITING_FOR_PLAYERS;
    }

    public void addPlayer(String playerId) {
        if( playerIds.size() >= 4 ) {
            // game is full
            log.info("Cannot add player {} as all spots are filled", playerId);
        }

        playerIds.add(playerId);

        state = State.WAITING_FOR_PLAYERS;
        if( playerIds.size() == 4 ) {
            state = State.WAITING_FOR_BETS;
        }
    }

    public void passBet(String playerId) {
        passedBets[getIndex(playerId)] = true;
        updateBettingStatus();
    }

    public void bet(int amount, String playerId) {
        if( amount > betAmount ) {
            betAmount = amount;
            bettingPlayerId = playerId;
        } else {
            log.info("Cannot bet {} as it is less than current bet of {}", amount, betAmount);
        }

        updateBettingStatus();
    }

    private void updateBettingStatus() {
        for( int i=0; i<passedBets.length; i++ ) {
            if( !passedBets[i] && i != getIndex(bettingPlayerId)) {
                state = State.WAITING_FOR_BETS;
                return;
            }
        }

        state = State.WAITING_FOR_TRUMP;
    }

    public void setTrump(Suit suit) {
        trump = suit;
        moves.get(0).previousWinner = getIndex(bettingPlayerId);
        state = State.WAITING_FOR_WINNER_MOVE;
    }

    private int getIndex(String playerId) {
        return playerIds.indexOf(playerId);
    }

    public boolean move(int playerId, Card card) {
        if( state != State.WAITING_FOR_WINNER_MOVE && state != State.WAITING_FOR_PLAYERS_MOVE) {
            // return can move only on these 2 states
            log.info("return can move only on these 2 states");
            return false;
        }

        Move currentMove = moves.get(moves.size() - 1);
        if( state == State.WAITING_FOR_WINNER_MOVE && playerId != currentMove.previousWinner ) {
            // return previous winner needs to move first
            log.info("return previous winner needs to move first");
            return false;
        }

        if( currentMove.card[playerId] != null ) {
            // return playerId has already moved
            log.info("return playerId has already moved");
            return false;
        }

        if( ! players[playerId].has(card) ) {
            // return playerId does not have card
            log.info("return playerId does not have card");
            return false;
        }

        // validate the move

        if( playerId != currentMove.previousWinner ) {
            // check if the suits match
            Suit currentSuit = currentMove.card[currentMove.previousWinner].suit;

            if( card.suit != currentSuit && players[playerId].has(currentSuit) ) {
                // return player has current suit cards and needs to throw them before another suit
                log.info("return player has current suit cards and needs to throw them before another suit");
                return false;
            }
        }

        // validated the move

        players[playerId].take(card);
        currentMove.card[playerId] = card;
        state = State.WAITING_FOR_PLAYERS_MOVE;

        if( currentMove.ready() ) {
            currentMove.winnerIndex = currentMove.getWinner();
            currentMove.winnerPoints = currentMove.getPoints();

            Move move = new Move();
            move.previousWinner = currentMove.winnerIndex;
            moves.add(move);

            if( players[0].getCards().isEmpty() ) {
                state = State.ENDED;
            } else {
                state = State.WAITING_FOR_WINNER_MOVE;
            }
        }

        return true;
    }
}
