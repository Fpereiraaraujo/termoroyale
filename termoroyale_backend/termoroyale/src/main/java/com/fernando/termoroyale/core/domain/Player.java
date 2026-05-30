package com.fernando.termoroyale.core.domain;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter @Setter
public class Player {
    private String id;
    private String name;

    // Forçamos o valor padrão e garantimos que o Jackson enxergue
    @JsonProperty("isAlive")
    @JsonAlias({"alive"})
    private boolean isAlive = true;
    private int currentAttempts = 0;
    private boolean won = false;

    private List<String> guesses = new ArrayList<>();
    private List<List<List<String>>> results = new ArrayList<>();
    // Map round -> seconds elapsed when player solved that round
    private Map<Integer, Integer> solvedTimes = new HashMap<>();

    // Construtor vazio para o Jackson/Redis
    public Player() {
        this.isAlive = true;
    }

    // Construtor completo
    public Player(String id, String name, boolean isAlive, int currentAttempts, boolean won) {
        this.id = id;
        this.name = name;
        this.isAlive = isAlive;
        this.currentAttempts = currentAttempts;
        this.won = won;
    }
}