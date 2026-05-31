package com.fernando.termoroyale.core.port;

import java.time.LocalDate;

/**
 * Porta de saída para obtenção de palavras do jogo.
 */
public interface DictionaryPort {

    /** Palavra-alvo para uma sala multiplayer (cíclica/rotativa) — tema GERAL. */
    String getRandomTargetWord();

    /** Palavra-alvo para uma sala multiplayer dentro de uma categoria temática. */
    String getRandomTargetWord(String theme);

    /** Valida se uma palavra enviada pelo jogador existe no dicionário oficial. */
    boolean isValidWord(String word);

    /** Palavra aleatória para modo Prática (solo) — pool amplo. */
    String getSoloRandomWord();

    /** Palavra determinística do dia (mesma para todo mundo na data informada). */
    String getDailyWord(LocalDate date);
}
