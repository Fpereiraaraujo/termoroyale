package com.fernando.termoroyale.adapters.out.dictionary;

import com.fernando.termoroyale.core.port.DictionaryPort;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class StaticDictionaryAdapter implements DictionaryPort {

    // Sequência FIXA de palavras-alvo para facilitar testes manuais.
    // Cada sala consome: 1 palavra no R1 + 2 no R2 + 4 no R3 = 7 palavras por partida.
    // O índice é cíclico, então a próxima sala começa pela palavra seguinte.
    private static final List<String> TARGET_WORDS = Arrays.asList(
            "PLANO",   // R1
            "TERMO", "ARENA",            // R2 (Dueto)
            "MUNDO", "NOBRE", "CORPO", "TEMPO" // R3 (Quarteto)
    );

    private final AtomicInteger cursor = new AtomicInteger(0);

    @Override
    public String getRandomTargetWord() {
        int idx = Math.floorMod(cursor.getAndIncrement(), TARGET_WORDS.size());
        return TARGET_WORDS.get(idx);
    }

    @Override
    public boolean isValidWord(String word) {
        // Qualquer palavra de 5 letras é aceita como chute válido.
        return word != null && word.trim().length() == 5;
    }
}
