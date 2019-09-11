package com.div.cards;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Slf4j
@SpringBootApplication
public class CardsApplication {

	public static void main(String[] args) {
		try {
			SpringApplication.run(CardsApplication.class, args);
		} catch (Exception e) {
			log.error("Something happened!", e);
		}
	}
}
