package com.fernando.termoroyale.core.domain;

public enum LetterStatus {
    CORRECT,  // Verde (Letra e posição certas)
    PRESENT,  // Amarelo (Letra certa, posição errada)
    ABSENT    // Cinza (Letra não existe ou já esgotou a cota)
}