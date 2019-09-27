package com.div.cards;

import lombok.Data;

import java.util.ArrayList;

@Data
public class Connection {
    String initiator;
    String acceptor;

    Offer offer;
    Answer answer;

    ArrayList<Candidate> offerCandidates = new ArrayList<>();
    ArrayList<Candidate> answerCandidates = new ArrayList<>();
}
