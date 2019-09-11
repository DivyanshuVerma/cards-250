package com.div.cards;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
@Slf4j
public class GameController {

    @GetMapping("/play")
    public ModelAndView play() {
        return new ModelAndView("play.html");
    }

    @GetMapping("/play/{gameId}")
    public ModelAndView playGame() {
        return new ModelAndView("play-game.html");
    }
}