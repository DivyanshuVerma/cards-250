package com.div.cards;

import lombok.Data;

import java.util.ArrayList;
import java.util.Collections;

@Data
public class Pack {
    ArrayList<Card> cards = new ArrayList<>(52);

    Pack() {
        for( var suit : Suit.values() ) {
            for (var face : Face.values()) {
                cards.add(new Card(face, suit));
            }
        }
    }

    void shuffle() {
        Collections.shuffle(cards);
    }

    Card pop() {
        return cards.remove(cards.size()-1);
    }

    public String toString() {
        return cards.toString();
    }
}
