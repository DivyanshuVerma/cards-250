package com.div.cards;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Suit {
    SPADES("♠"), CLUBS("♣"), HEARTS("♥"), DIAMONDS("♦");

    private final String symbol;
}
