package com.fernando.termoroyale.core.usecase;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.HashMap;
import java.util.Map;

/**
 * Filtro simples de palavrões PT-BR + EN para nomes de sala e jogador.
 * Normaliza acentos e leet-speak básico antes de checar.
 */
@Component
public class ProfanityFilter {

    private static final Set<String> BANNED = Set.of(
            // PT
            "merda", "caralho", "porra", "viado", "puta", "putao", "fdp",
            "cuzao", "cuzinho", "otario", "arrombado", "buceta", "boceta",
            "escroto", "babaca", "retardado", "vagabunda", "piranha", "corno",
            "fodase", "foda", "vadia", "punheta",
            // EN
            "fuck", "shit", "bitch", "asshole", "dick", "pussy", "cunt",
            "faggot", "nigger", "retard", "slut", "whore", "motherfucker"
    );

    private static final Map<String, Pattern> PATTERNS = buildPatterns();

    private static Map<String, Pattern> buildPatterns() {
        Map<String, Pattern> m = new HashMap<>();
        for (String w : BANNED) m.put(w, Pattern.compile("\\b" + Pattern.quote(w) + "\\b"));
        return m;
    }

    public boolean contains(String text) {
        if (text == null || text.isBlank()) return false;
        String n = normalize(text);
        for (Pattern p : PATTERNS.values()) {
            if (p.matcher(n).find()) return true;
        }
        return false;
    }

    private String normalize(String s) {
        String lower = s.toLowerCase();
        String stripped = Normalizer.normalize(lower, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        StringBuilder b = new StringBuilder(stripped.length());
        for (char c : stripped.toCharArray()) {
            switch (c) {
                case '0' -> b.append('o');
                case '1' -> b.append('i');
                case '3' -> b.append('e');
                case '4' -> b.append('a');
                case '5' -> b.append('s');
                case '7' -> b.append('t');
                case '@' -> b.append('a');
                case '$' -> b.append('s');
                default -> b.append(c);
            }
        }
        return b.toString();
    }
}
