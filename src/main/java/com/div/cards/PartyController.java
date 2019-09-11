package com.div.cards;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.inject.Inject;
import java.util.HashMap;

@Slf4j
@Controller
public class PartyController {

    @Inject UUIDUtil uuidUtil;

    // party to gameId
    HashMap<String, String> activeParty = new HashMap<>();

    // gameId to playerId and game stat
    HashMap<String, GameStat> activeGames = new HashMap<>();

    @GetMapping("/party/{name}")
    @ResponseBody
    public String createOrJoinParty(@PathVariable String name) {
        log.info("Creating party with name {}", name);

        // validate party name

        String gameId;
        String playerId = uuidUtil.base64();
        if( activeParty.containsKey(name) ) {
            gameId = activeParty.get(name);

            if( ! activeGames.containsKey(gameId) ) {
                log.warn("Game id present in active party but not in active game");
                activeGames.put(gameId, new GameStat());
            }
        } else {
            gameId = uuidUtil.base64();
            activeParty.put(name, gameId);
            activeGames.put(gameId, new GameStat());
        }

        GameStat stat = activeGames.get(gameId);
        if( stat.playerIds.size() >= 4 ) {
            // return party full
            log.info("Party {} is full", name);
            return "party full";
        }

        stat.addPlayer(playerId);
        return gameId + ">>" + playerId;
    }

    @GetMapping("/game/{gameId}/{playerId}/status")
    @ResponseBody
    public GameStat status(@PathVariable String gameId, @PathVariable String playerId) {

        if( !activeGames.containsKey(gameId) ) {
            log.info("Game with id {} does not exist", gameId);
            return null;
        }

        GameStat stat = activeGames.get(gameId);
        int playerIndex = stat.playerIds.indexOf(playerId);
        if( playerIndex == -1 ) {
            log.info("Player with id {} does not belong in game {}", playerId, gameId);
            return null;
        }

        return stat;
    }


    @GetMapping("/game/{gameId}/{playerId}/bet/{amount}")
    @ResponseBody
    public GameStat bet(@PathVariable String gameId, @PathVariable String playerId, @PathVariable Integer amount) {
        if( !activeGames.containsKey(gameId) ) {
            log.info("Game with id {} does not exist", gameId);
            return null;
        }

        GameStat stat = activeGames.get(gameId);
        int playerIndex = stat.playerIds.indexOf(playerId);
        if( playerIndex == -1 ) {
            log.info("Player with id {} does not belong in game {}", playerId, gameId);
            return null;
        }

        stat.bet(amount, playerId);
        return stat;
    }

    @GetMapping("/game/{gameId}/{playerId}/bet/pass")
    @ResponseBody
    public GameStat passBet(@PathVariable String gameId, @PathVariable String playerId) {
        if( !activeGames.containsKey(gameId) ) {
            log.info("Game with id {} does not exist", gameId);
            return null;
        }

        GameStat stat = activeGames.get(gameId);
        int playerIndex = stat.playerIds.indexOf(playerId);
        if( playerIndex == -1 ) {
            log.info("Player with id {} does not belong in game {}", playerId, gameId);
            return null;
        }

        if( stat.bettingPlayerId.equals(playerId) ) {
            log.info("Highest betting player cannot pass");
            return stat;
        }

        stat.passBet(playerId);
        return stat;
    }

    @GetMapping("/game/{gameId}/{playerId}/trump/{suit}")
    @ResponseBody
    public GameStat trump(@PathVariable String gameId, @PathVariable String playerId, @PathVariable Suit suit) {
        if( !activeGames.containsKey(gameId) ) {
            log.info("Game with id {} does not exist", gameId);
            return null;
        }

        GameStat stat = activeGames.get(gameId);
        int playerIndex = stat.playerIds.indexOf(playerId);
        if( playerIndex == -1 ) {
            log.info("Player with id {} does not belong in game {}", playerId, gameId);
            return null;
        }

        if( stat.bettingPlayerId.equals(playerId) ) {
            stat.setTrump(suit);
        } else {
            log.info("Player {} has not won betting", playerId);
        }

        return stat;
    }

    @GetMapping("/game/{gameId}/{playerId}/move/{face}/{suit}")
    @ResponseBody
    public Object move(@PathVariable String gameId, @PathVariable String playerId, @PathVariable Face face, @PathVariable Suit suit) {

        if( !activeGames.containsKey(gameId) ) {
            log.info("Game with id {} does not exist", gameId);
            return null;
        }

        GameStat stat = activeGames.get(gameId);
        int playerIndex = stat.playerIds.indexOf(playerId);
        if( playerIndex == -1 ) {
            log.info("Player with id {} does not belong in game {}", playerId, gameId);
            return null;
        }

        if( ! stat.move(playerIndex,  new Card(face, suit))) {
            return "error";
        } else {
            return stat;
        }
    }
}