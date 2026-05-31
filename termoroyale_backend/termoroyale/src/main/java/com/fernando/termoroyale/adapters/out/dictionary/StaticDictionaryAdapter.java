package com.fernando.termoroyale.adapters.out.dictionary;

import com.fernando.termoroyale.core.port.DictionaryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class StaticDictionaryAdapter implements DictionaryPort {

    // Sequência FIXA de palavras-alvo para facilitar testes manuais no multiplayer.
    private static final List<String> TARGET_WORDS = Arrays.asList(
            "PLANO",
            "TERMO", "ARENA",
            "MUNDO", "NOBRE", "CORPO", "TEMPO"
    );

    // Pool amplo usado em Prática solo e Desafio Diário.
    // Lista curada de palavras PT-BR de 5 letras sem acento.
    private static final List<String> SOLO_POOL = Arrays.asList(
            "PLANO","TERMO","ARENA","MUNDO","NOBRE","CORPO","TEMPO","FELIZ","PRAIA","NAVIO",
            "CAIXA","FORTE","LIVRO","PEDRA","CARRO","GENTE","NOITE","BRAVO","NUVEM","PORTA",
            "CHUVA","SONHO","FRUTA","BICHO","CINZA","DENTE","CABRA","FAROL","FOGAO","GALHO",
            "HORTA","JOGOS","LEITE","MANGA","NORMA","OUVIR","PALMA","QUEDA","TIGRE","VIDRO",
            "ZEBRA","BANHO","CAMPO","DUETO","ETICA","FRASE","HASTE","JUSTA","MARCO","NICHO",
            "OLEOS","PISTA","RAMOS","SETAS","VINHO","ZONAS","AGUDO","BEIJO","CINTO","DRAMA",
            "GRIPE","HUMOR","IMPAR","JEITO","LANCE","METAL","NORTE","PRESA","RAPTO","TOSSE",
            "VAGAO","ARCOS","BOLSA","CHAMA","ETAPA","FENDA","IRMAO","JURAR","LARVA","MENTA",
            "NIVEL","OASIS","ROSTO","SUITE","TROCO","BASTA","CACAU","DUNAS","GUIAR","HABIL",
            "LIMAO","NOVAS","PRADO","SUSTO","TUMBA","UNIAO","VERAO","BRISA","CIRCO","DOTAR",
            "FRACO","GRATA","HOMEM","INATO","JATOS","LADRA","MITOS","PRECE","RUMOS","SALTO",
            "TRAMA","UNHAS","VIDAS","COROA","DOSES","FOLHA","GLOBO","HABIT","INSTA","LASER",
            "MOEDA","NIDOS","OPACO","PUDIM","QUARK","ROUPA","SOJAS","TACOS","VAGAS","XAROP",
            "AMIGO","BARCO","CIDAD","DEDOS","FOLIA","GANSO","HIDRO","INDIO","LUVAS","MORRO",
            "NOIVO","OSSOS","PATIO","REINO","SOLOS","TOMAR","VAGAR","VOZES","BOLOS","COVIL"
    );

    /** Pools temáticos para criação de sala com categoria escolhida. */
    private static final Map<String, List<String>> THEME_POOLS = Map.of(
            "GERAL", TARGET_WORDS,
            "ANIMAIS", Arrays.asList(
                    "TIGRE","ZEBRA","CABRA","BICHO","GANSO","COBRA","POMBO","MOSCA",
                    "RATOS","SAPOS","VACAS","LOBOS","BURRO","MULAS","PATOS","PERUS",
                    "LINCE","ANTAS","FOCAS","URUBU"),
            "COMIDA", Arrays.asList(
                    "BOLOS","FRUTA","MANGA","LEITE","ARROZ","CARNE","PEIXE","DOCES",
                    "PASTA","FRITA","TOSTA","CALDO","MASSA","SOPAS","COCOS","PIZZA",
                    "BIFES","CACAU","LIMAO","MELAO"),
            "VERBOS", Arrays.asList(
                    "COMER","SABER","VIVER","FALAR","ANDAR","PEDIR","OUVIR","CRIAR",
                    "JOGAR","LEVAR","MORAR","TIRAR","ESTAR","CALAR","CASAR","MUDAR",
                    "CAVAR","CABER","VOTAR","CHUTA")
    );

    private final AtomicInteger cursor = new AtomicInteger(0);

    @Override
    public String getRandomTargetWord() {
        int idx = Math.floorMod(cursor.getAndIncrement(), TARGET_WORDS.size());
        return TARGET_WORDS.get(idx);
    }

    @Override
    public String getRandomTargetWord(String theme) {
        List<String> pool = THEME_POOLS.getOrDefault(
                theme == null ? "GERAL" : theme.toUpperCase(), TARGET_WORDS);
        int idx = ThreadLocalRandom.current().nextInt(pool.size());
        return pool.get(idx);
    }

    @Override
    public boolean isValidWord(String word) {
        return word != null && word.trim().length() == 5;
    }

    @Override
    public String getSoloRandomWord() {
        int idx = ThreadLocalRandom.current().nextInt(SOLO_POOL.size());
        return SOLO_POOL.get(idx);
    }

    @Override
    public String getDailyWord(LocalDate date) {
        // Hash determinístico estável: mesma data => mesma palavra para todos os jogadores.
        long seed = date.toEpochDay();
        int hash = Long.hashCode(seed * 2654435761L); // Knuth multiplicative hash
        int idx = Math.floorMod(hash, SOLO_POOL.size());
        return SOLO_POOL.get(idx);
    }
}

