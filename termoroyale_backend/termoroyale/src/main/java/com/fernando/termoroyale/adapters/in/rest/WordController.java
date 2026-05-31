package com.fernando.termoroyale.adapters.in.rest;

import com.fernando.termoroyale.core.port.DictionaryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;

/**
 * REST público para modos Prática solo e Desafio Diário.
 * Não requer autenticação nem WebSocket.
 */
@RestController
@RequestMapping("/api/word")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WordController {

    private final DictionaryPort dictionary;

    /** Palavra aleatória para o modo Prática. */
    @GetMapping("/random")
    public Map<String, String> random() {
        return Map.of("word", dictionary.getSoloRandomWord());
    }

    /** Palavra do dia (UTC), determinística — todos veem a mesma. */
    @GetMapping("/daily")
    public Map<String, String> daily() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return Map.of(
                "date", today.toString(),
                "word", dictionary.getDailyWord(today)
        );
    }

    /** Validação de palavra (mesma regra do multiplayer). */
    @GetMapping("/validate")
    public Map<String, Boolean> validate(@RequestParam("word") String word) {
        return Map.of("valid", dictionary.isValidWord(word));
    }
}
