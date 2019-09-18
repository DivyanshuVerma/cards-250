package com.div.cards;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import javax.inject.Inject;
import java.util.ArrayList;

@Slf4j
@Controller
public class PeerController {

    @Inject UUIDUtil uuidUtil;

    ArrayList<String> peers = new ArrayList<>();
    ArrayList<Connection> conns = new ArrayList<>();

    @GetMapping("/peer")
    @ResponseBody
    public ModelAndView createPeer() {
        String peerId = uuidUtil.base64();

        ModelAndView mav = new ModelAndView("peer.html");
        mav.addObject("peerId", peerId);

        if( !peers.contains(peerId) ) {
            ArrayList<Connection> peerConnections = new ArrayList<>();
            for( String oldPeer : peers ) {
                Connection connection = new Connection();
                connection.setInitiator(oldPeer);
                connection.setAcceptor(peerId);
                peerConnections.add(connection);
            }

            peers.add(peerId);
            conns.addAll(peerConnections);
        }

        return mav;
    }

    @GetMapping("/peer/{peerId}/connections")
    @ResponseBody
    public ArrayList<Connection> peerConnections(@PathVariable String peerId) {
        ArrayList<Connection> peerConnection = new ArrayList<>();

        for( Connection connection : conns ) {
            if( connection.getInitiator().equals(peerId) || connection.getAcceptor().equals(peerId) ) {
                peerConnection.add(connection);
            }
        }

        return peerConnection;
    }

    @PostMapping("/peer/{initiator}/offer/{acceptor}")
    @ResponseBody
    public String offer(@PathVariable String initiator, @PathVariable String acceptor, @RequestBody Offer offer) {
        log.info("Got offer for {}->{}: {}", initiator, acceptor, offer);
        for( Connection connection : conns ) {
            if( connection.getInitiator().equals(initiator) && connection.getAcceptor().equals(acceptor) ) {
                connection.setOffer(offer);
                return "ok";
            }
        }

        return "err";
    }

    @PostMapping("/peer/{acceptor}/answer/{initiator}")
    @ResponseBody
    public String answer(@PathVariable String initiator, @PathVariable String acceptor, @RequestBody Answer answer) {
        log.info("Got offer for {}->{}: {}", initiator, acceptor, answer);
        for( Connection connection : conns ) {
            if( connection.getInitiator().equals(initiator) && connection.getAcceptor().equals(acceptor) ) {
                connection.setAnswer(answer);
                return "ok";
            }
        }

        return "err";
    }

    @PostMapping("/peer/{initiator}/offerCandidate/{acceptor}")
    @ResponseBody
    public String offerCandidate(@PathVariable String initiator, @PathVariable String acceptor, @RequestBody Candidate candidate) {
        log.info("Got offer candidate for {}->{}: {}", initiator, acceptor, candidate);
        for( Connection connection : conns ) {
            if( connection.getInitiator().equals(initiator) && connection.getAcceptor().equals(acceptor) ) {
                connection.getOfferCandidates().add(candidate);
                return "ok";
            }
        }

        return "err";
    }

    @PostMapping("/peer/{acceptor}/answerCandidate/{initiator}")
    @ResponseBody
    public String answerCandidate(@PathVariable String initiator, @PathVariable String acceptor, @RequestBody Candidate candidate) {
        log.info("Got offer candidate for {}->{}: {}", initiator, acceptor, candidate);
        for( Connection connection : conns ) {
            if( connection.getInitiator().equals(initiator) && connection.getAcceptor().equals(acceptor) ) {
                connection.getAnswerCandidates().add(candidate);
                return "ok";
            }
        }

        return "err";
    }

    @GetMapping("/peer/list")
    @ResponseBody
    public ArrayList<String> listPeer() {
        return peers;
    }

    @GetMapping("/peer/connections")
    @ResponseBody
    public ArrayList<Connection> listConnections() {
        return conns;
    }
}

@Data
class Connection {
    String initiator;
    String acceptor;

    Offer offer;
    Answer answer;

    ArrayList<Candidate> offerCandidates = new ArrayList<>();
    ArrayList<Candidate> answerCandidates = new ArrayList<>();
}

@Data
class Offer {
    String type;
    String sdp;
}

@Data
class Answer {
    String type;
    String sdp;
}

@Data
class Candidate {
    String candidate;
    String sdpMid;
    String sdpMLineIndex;
}