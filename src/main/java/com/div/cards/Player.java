package com.div.cards;

import lombok.Data;

import java.util.ArrayList;

@Data
public class Player {
    ArrayList<Card> cards = new ArrayList<>();

    void give(Card card) {
        cards.add(card);
    }

    boolean has(Card card) {
        return cards.contains(card);
    }

    boolean has(Suit suit) {
        return cards.stream().anyMatch(card -> card.suit == suit );
    }

    void take(Card card) {
        cards.remove(card);
    }
}
