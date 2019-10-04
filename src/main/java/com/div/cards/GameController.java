package com.div.cards;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import javax.inject.Inject;
import java.util.*;
import java.util.function.Consumer;

@Controller
@Slf4j
public class GameController {

    @Inject UUIDUtil uuidUtil;

    private final GoogleIdTokenVerifier verifier;

    public GameController() {
        verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory()).build();
    }

    HashMap<String, HashMap<String, ArrayList<Connection>>> party = new HashMap<>();
    private final String PARTY_NAME_REGEX = "[a-zA-Z0-9]+";
    private final String ERROR_PREFIX = "err:";

    private final List<String> gameTags = Arrays.asList(
            "Tomato", "Potato", "Mario", "Luigi", "Batman", "Flash", "MrBot", "Pikachu", "Voldemort", "Potter",
            "Joey", "Chandler", "Gordon", "WalterW", "Heisenberg", "Tesla"
    );

    @GetMapping("/play")
    public ModelAndView play() {
        ModelAndView mav = new ModelAndView("play.html");
        var index = (int) (Math.random() * gameTags.size());
        mav.addObject("gameTag", gameTags.get(index));
        return mav;
    }

    @GetMapping("/party/list")
    @ResponseBody
    public HashMap<String, HashMap<String, ArrayList<Connection>>> list() {
        return party;
    }

    @GetMapping("/party/clear")
    @ResponseBody
    public String clear() {
        party.clear();
        return "ok";
    }

    @GetMapping("/party/{partyName}/list")
    @ResponseBody
    public HashMap<String, ArrayList<Connection>> list(@PathVariable String partyName) {
        return party.get(partyName);
    }

    @GetMapping("/party/{partyName}/clear")
    @ResponseBody
    public String clear(@PathVariable String partyName) {
        party.get(partyName).clear();
        return "ok";
    }

    @GetMapping("/party/{partyName}")
    @ResponseBody
    public Map<String, String> createOrJoinParty(@PathVariable String partyName,
                                                 @RequestParam(value = "peerId", required = false) String peerId,
                                                 @RequestParam(value = "id_token", required = false) String idToken) {
        log.info("Got request for party {}", partyName);

        if( party.containsKey(partyName) && party.get(partyName).size() >= 4 ) {
            log.info("Party {} is full", partyName);
            return Collections.singletonMap("err", "Party is full");
        }

        if( ! hasOnlyAlphabetsAndNumbers(partyName) ) {
            log.info("Party name {} does not satisfy regex {}", partyName, PARTY_NAME_REGEX);
            return Collections.singletonMap("err", "Party name should satisfy " + PARTY_NAME_REGEX);
        }

        log.info("Parameters received: peerId {} id_token {}", peerId, idToken);

        // authenticate
        String newPeer = null;
        if( idToken != null ) {
            try {
                GoogleIdToken token = verifier.verify(idToken);
                if( token != null ) {
                    log.info("Got id token {}", token);
                    newPeer = (String) token.getPayload().get("given_name");
                }
            } catch (Exception e) {
                log.warn("Exception occured while verifying token", e);
            }
        }

        if( newPeer == null && peerId != null ) {
            newPeer = peerId;
        } else {
            newPeer = uuidUtil.base64();
        }

        if( ! party.containsKey(partyName) ) {
            log.info("Creating party {} for peer {}", partyName, newPeer);
            party.put(partyName, new HashMap<>());
        }

        var peers = party.get(partyName);
        while( peers.containsKey(newPeer) ) {
            newPeer += String.valueOf((int) (Math.random() * 9 + 1));
        }

        addPeerToParty(newPeer, partyName);
        return Collections.singletonMap("peerId", newPeer);
    }

    private boolean hasOnlyAlphabetsAndNumbers(String name) {
        return name.matches(PARTY_NAME_REGEX);
    }

    private void addPeerToParty(String newPeer, String partyName) {
        var peers = party.get(partyName);
        var newConnections = new ArrayList<Connection>();

        for( var oldPeer : peers.keySet() ) {
            var connection = new Connection();
            connection.setInitiator(oldPeer);
            connection.setAcceptor(newPeer);

            peers.get(oldPeer).add(connection);
            newConnections.add(connection);
        }

        peers.put(newPeer, newConnections);
    }

    @GetMapping("/party/{partyName}/peer/{peerId}/connections")
    @ResponseBody
    public Object connections(@PathVariable String partyName, @PathVariable String peerId) {
        log.info("Got request for party {} connections by peer {}", partyName, peerId);

        if( ! party.containsKey(partyName) ) {
            log.info("Party {} not found", partyName);
            return ERROR_PREFIX + "party not found";
        }

        var peers = party.get(partyName);
        if( ! peers.containsKey(peerId) ) {
            log.info("Peer {} not found in party {}", peerId, partyName);
            return ERROR_PREFIX + "peer not found in party";
        }

        return peers.get(peerId);
    }

    /**
     * Signalling controllers
     */

    @PostMapping("/party/{partyName}/peer/{initiator}/offer/{acceptor}")
    @ResponseBody
    public String offer(@PathVariable String partyName, @PathVariable String initiator,
                        @PathVariable String acceptor, @RequestBody Offer offer) {
        return validateParamsAndConsumeConnection(
                partyName, initiator, acceptor, "offer", connection -> connection.setOffer(offer));
    }

    @PostMapping("/party/{partyName}/peer/{initiator}/offerCandidate/{acceptor}")
    @ResponseBody
    public String offerCandidate(@PathVariable String partyName, @PathVariable String initiator,
                                 @PathVariable String acceptor, @RequestBody ArrayList<Candidate> candidates) {
        return validateParamsAndConsumeConnection(
                partyName, initiator, acceptor, "offerCandidate", connection -> connection.setOfferCandidates(candidates));
    }

    @PostMapping("/party/{partyName}/peer/{acceptor}/answer/{initiator}")
    @ResponseBody
    public String answer(@PathVariable String partyName, @PathVariable String initiator,
                         @PathVariable String acceptor, @RequestBody Answer answer) {
        return validateParamsAndConsumeConnection(
                partyName, initiator, acceptor, "answer", connection -> connection.setAnswer(answer));
    }


    @PostMapping("/party/{partyName}/peer/{acceptor}/answerCandidate/{initiator}")
    @ResponseBody
    public String answerCandidate(@PathVariable String partyName, @PathVariable String initiator,
                                  @PathVariable String acceptor, @RequestBody ArrayList<Candidate> candidates) {
        return validateParamsAndConsumeConnection(
                partyName, initiator, acceptor, "answerCandidate", connection -> connection.setAnswerCandidates(candidates));
    }

    private String validateParamsAndConsumeConnection(String partyName, String initiator,
                                                      String acceptor, String method, Consumer<Connection> consumer) {
        if( ! party.containsKey(partyName) ) {
            log.info("Party {} not found", partyName);
            return ERROR_PREFIX + "party not found";
        }

        var peers = party.get(partyName);
        if( ! peers.containsKey(initiator) ) {
            log.info("Peer {} not found in party {}", initiator, partyName);
            return ERROR_PREFIX + "initiator not found in party";
        }

        var conns = peers.get(initiator);
        for( Connection connection : conns ) {
            if( connection.getAcceptor().equals(acceptor) ) {
                consumer.accept(connection);
                log.info("Processed {} {}:{}->{}", method, partyName, initiator, acceptor);
                return "ok";
            }
        }

        log.info("Acceptor {} not found in party {}", acceptor, partyName);
        return ERROR_PREFIX + "acceptor not found in party";
    }
}