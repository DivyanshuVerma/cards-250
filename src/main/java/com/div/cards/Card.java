package com.div.cards;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Card {
    @JsonIgnore
    Face face;
    @JsonIgnore Suit suit;

    @JsonValue
    public String toString() {
        return face.getSymbol() + suit.getSymbol();
    }

    @JsonIgnore
    public int getPoints() {
        if( face == Face.SEVEN && suit == Suit.HEARTS ) {
            return 30;
        }

        if( face == Face.FIVE ) {
            return 5;
        }

        if( face == Face.TEN || face == Face.JACK || face == Face.QUEEN || face == Face.KING || face == Face.ACE ) {
            return 10;
        }

        return 0;
    }
}
