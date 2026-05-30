package com.fernando.termoroyale.core.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RedisHash("Room")
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Room {
    private String id = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    private String name;
    private int currentRound = 1;
    private List<Player> players = new ArrayList<>();
    private int maxAttempts = 6;
    private int maxPlayers = 20;

    // CAMPOS QUE ESTAVAM FALTANDO (Agora declarados para o Lombok gerar os métodos)
    private long phaseStartTimestamp;
    private long createdAt;

    private int playersAtRoundStart = 0;
    private int initialPlayersCount = 0;
    private boolean started = false;
    private boolean finished = false;
    private List<String> targetWords = new ArrayList<>();
    private String status = "WAITING";
    private int timeLeft = 30;
    private int phaseDuration = 300;
    private Map<Integer, Map<String, Integer>> roundTimes = new HashMap<>();

    public void addPlayer(Player player) {
        this.players.add(player);
    }

    public void updatePlayerProgress(String playerName, String word, boolean won, List<List<String>> results) {
        players.stream()
                .filter(p -> p.getName().equalsIgnoreCase(playerName))
                .findFirst()
                .ifPresent(p -> {
                    p.getGuesses().add(word);
                    p.getResults().add(results);
                    p.setCurrentAttempts(p.getCurrentAttempts() + 1);

                    if (won) {
                        p.setWon(true);
                        if (!p.getSolvedTimes().containsKey(this.currentRound)) {
                            int elapsed = Math.max(0, this.phaseDuration - this.timeLeft);
                            p.getSolvedTimes().put(this.currentRound, elapsed);
                            this.roundTimes.computeIfAbsent(this.currentRound, k -> new HashMap<>())
                                    .put(p.getName(), elapsed);
                        }
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

    @TimeToLive
    // Expiração da sala em segundos (20 minutos)
    private Long expiration = 1200L;
}