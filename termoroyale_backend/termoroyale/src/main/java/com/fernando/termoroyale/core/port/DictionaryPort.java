package com.fernando.termoroyale.core.port;

/**
 * Porta de saída para obtenção de palavras do jogo.
 */
public interface DictionaryPort {

    /**
     * Retorna uma palavra aleatória de 5 letras para ser o alvo da sala.
     */
    String getRandomTargetWord();

    /**
     * Valida se uma palavra enviada pelo jogador existe no dicionário oficial.
     */
    boolean isValidWord(String word);
}