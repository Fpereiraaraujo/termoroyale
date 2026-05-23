package com.fernando.termoroyale.adapters.out.dictionary;

import com.fernando.termoroyale.core.port.DictionaryPort;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
public class StaticDictionaryAdapter implements DictionaryPort {

    // Lista de palavras que podem ser sorteadas como a "Palavra do Dia"
    private static final List<String> TARGET_WORDS = Arrays.asList(
            "SAGAZ", "AMAGO", "TERMO", "NOBRE", "ALGOZ", "ERUDI", "PLENO", "ETICA", "MUNDO", "TENAZ",
            "SUTIL", "VIGOR", "FORTE", "PODER", "IDEIA", "CERNE", "ORDEM", "FAZER", "VALER", "MORAL",
            "POVOO", "HONRA", "JUSTO", "MUITO", "ASSIM", "SOBRE", "VIVER", "ARENA", "CORPO", "TEMPO"
    );

    private final Random random = new Random();

    @Override
    public String getRandomTargetWord() {
        // O backend escolhe UMA dessas para ser a certa
        return TARGET_WORDS.get(random.nextInt(TARGET_WORDS.size()));
    }

    @Override
    public boolean isValidWord(String word) {
        // LOGICA CORRIGIDA:
        // Para o jogo fluir, qualquer palavra de 5 letras é "válida" para ser chutada.
        // Se você quiser ser rigoroso no futuro, pode carregar um arquivo .txt com
        // todas as palavras da língua portuguesa aqui.
        return word != null && word.trim().length() == 5;
    }
}