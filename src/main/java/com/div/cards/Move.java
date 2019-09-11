package com.div.cards;

import lombok.Data;

@Data
public class Move {
    Card[] card = new Card[4];
    int previousWinner;
    int winnerIndex;
    int winnerPoints;

    public boolean ready() {
        return card[0] != null && card[1] != null && card[2] != null && card[3] != null;
    }

    public int getPoints() {
        return ready() ? card[0].getPoints() + card[1].getPoints() + card[2].getPoints() + card[3].getPoints() : 0;
    }

    public int getWinner() {
        if( ! ready() ) {
            return -1;
        }

        int winnerIndex = previousWinner;
        Face winnerFace = card[previousWinner].face;
        Suit winnerSuit = card[previousWinner].suit;

        for( int i=1; i<4; i++ ) {
            int currentPlayerIndex = (winnerIndex + i)%4;
            if (card[currentPlayerIndex].suit == winnerSuit && card[currentPlayerIndex].face.ordinal() > winnerFace.ordinal()) {
                winnerIndex = currentPlayerIndex;
                winnerFace = card[currentPlayerIndex].face;
            }
        }

        return winnerIndex;
    }
}
