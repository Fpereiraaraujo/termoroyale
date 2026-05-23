package com.fernando.termoroyale.core.domain;

public record GuessResponse(
        String word,
        LetterStatus[] status, // [CORRECT, PRESENT, ABSENT]
        boolean won,
        int remainingAttempts
) {}

