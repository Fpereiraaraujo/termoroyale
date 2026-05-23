package com.fernando.termoroyale;

import com.fernando.termoroyale.core.port.DictionaryPort;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import com.fernando.termoroyale.core.usecase.MatchmakingUseCase;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.simp.SimpMessagingTemplate;


@SpringBootApplication
public class TermoroyaleApplication {

	public static void main(String[] args) {
		SpringApplication.run(TermoroyaleApplication.class, args);
	}


	@Bean
	public MatchmakingUseCase matchmakingUseCase(RoomRepositoryPort roomRepository,SimpMessagingTemplate messagingTemplate) {
		DictionaryPort dummyDictionary = new DictionaryPort() {
			@Override
			public boolean isValidWord(String word) { return true; }
			@Override
			public String getRandomTargetWord() { return "PLANO"; }
		};

		return new MatchmakingUseCase(roomRepository, dummyDictionary, messagingTemplate);
	}



}