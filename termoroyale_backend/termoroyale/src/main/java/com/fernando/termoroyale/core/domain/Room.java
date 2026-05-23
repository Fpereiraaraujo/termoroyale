package com.fernando.termoroyale.core.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Room {
    private String id = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    private String name;
    private int currentRound = 1;
    private List<Player> players = new ArrayList<>();
    private int maxAttempts = 6;
    private boolean started = false;
    private boolean finished = false;
    private List<String> targetWords = new ArrayList<>();
    private String status = "WAITING";
    private int timeLeft = 180;


    public Room() {
        this.id = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        this.timeLeft = 180;
        this.status = "WAITING";
        this.players = new ArrayList<>();
        this.maxAttempts = 6;
    }

    public void setRound(int round) {
        this.currentRound = round;
        this.players.forEach(p -> {
            if (p.isAlive()) {
                p.setCurrentAttempts(0);
                p.setWon(false);
                p.setGuesses(new ArrayList<>());
                p.setResults(new ArrayList<>());
            }
        });
    }

    public void addPlayer(Player player) {
        if (this.players == null) this.players = new ArrayList<>();
        player.setAlive(true);
        player.setCurrentAttempts(0);
        player.setWon(false);

        boolean exists = this.players.stream().anyMatch(p -> p.getName().equalsIgnoreCase(player.getName()));
        if (!exists) {
            this.players.add(player);
        }
    }


    public void updatePlayerProgress(String playerName, String word, boolean won, List<List<String>> allResults) {
        players.stream()
                .filter(p -> p.getName().equals(playerName))
                .findFirst()
                .ifPresent(p -> {
                    p.getGuesses().add(word);
                    p.getResults().add(allResults);
                    p.setCurrentAttempts(p.getCurrentAttempts() + 1);

                    if (won) {
                        p.setWon(true);
                    } else if (p.getCurrentAttempts() >= maxAttempts) {
                        p.setAlive(false);
                    }
                });
    }

    public int getRemainingAttempts(String playerName) {
        return players.stream()
                .filter(p -> p.getName().equals(playerName))
                .findFirst()
                .map(p -> maxAttempts - p.getCurrentAttempts())
                .orElse(maxAttempts);
    }


}