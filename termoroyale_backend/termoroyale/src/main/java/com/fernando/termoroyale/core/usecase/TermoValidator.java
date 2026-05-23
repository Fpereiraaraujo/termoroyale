package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.LetterStatus;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Component
public class TermoValidator {

    public LetterStatus[] validate(String guess, String target) {
        int length = target.length();
        LetterStatus[] results = new LetterStatus[length];

        Map<Character, Integer> targetLetterCounts = new HashMap<>();
        for (char c : target.toUpperCase().toCharArray()) {
            targetLetterCounts.put(c, targetLetterCounts.getOrDefault(c, 0) + 1);
        }

        char[] guessChars = guess.toUpperCase().toCharArray();
        char[] targetChars = target.toUpperCase().toCharArray();

        // 1ª Passagem: VERDE (CORRECT)
        for (int i = 0; i < length; i++) {
            if (guessChars[i] == targetChars[i]) {
                results[i] = LetterStatus.CORRECT;
                targetLetterCounts.put(guessChars[i], targetLetterCounts.get(guessChars[i]) - 1);
            }
        }

        // 2ª Passagem: AMARELO (PRESENT) ou CINZA (ABSENT)
        for (int i = 0; i < length; i++) {
            if (results[i] == null) {
                char c = guessChars[i];
                if (targetLetterCounts.getOrDefault(c, 0) > 0) {
                    results[i] = LetterStatus.PRESENT;
                    targetLetterCounts.put(c, targetLetterCounts.get(c) - 1);
                } else {
                    results[i] = LetterStatus.ABSENT;
                }
            }
        }
        return results;
    }
}