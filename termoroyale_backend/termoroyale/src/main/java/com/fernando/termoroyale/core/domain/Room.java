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
@JsonIgnoreProperties(ignoreUnknown = true)
public class Room {
    private String id = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    private String name;
    private int currentRound = 1;
    private List<Player> players = new ArrayList<>();
    private int maxAttempts = 6;
    private int maxPlayers = 20;
    // number of players that started the current round (alive at round start)
    private int playersAtRoundStart = 0;
    // total number of players that joined the room (used for quota calculations)
    private int initialPlayersCount = 0;
    private boolean started = false;
    private boolean finished = false;
    private List<String> targetWords = new ArrayList<>();
    private String status = "WAITING";
    private int timeLeft = 30;
    // Duration of each phase in seconds (default 5 minutes)
    private int phaseDuration = 300;
    // epoch seconds when the current phase started
    private long phaseStartTimestamp = System.currentTimeMillis() / 1000L;
    // epoch seconds when the room was created
    private long createdAt = System.currentTimeMillis() / 1000L;
    // per-round recorded times: round -> (playerName -> secondsTaken)
    private Map<Integer, Map<String, Integer>> roundTimes = new HashMap<>();
    // flag to indicate a pending automatic advancement (short grace period allowing UIs to show winners)
    private boolean pendingAdvance = false;


    public Room() {
        this.id = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        this.timeLeft = 30;
        this.status = "WAITING";
        this.players = new ArrayList<>();
        this.maxAttempts = 6;
    }

    public void setRound(int round) {
        this.currentRound = round;
        // record how many players started this round (those alive now)
        this.playersAtRoundStart = (int) this.players.stream().filter(Player::isAlive).count();

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


    public void updatePlayerProgress(String playerName, String word, List<List<String>> allResults) {
        players.stream()
                .filter(p -> p.getName().equals(playerName))
                .findFirst()
                .ifPresent(p -> {
                    p.getGuesses().add(word);
                    p.getResults().add(allResults);
                    p.setCurrentAttempts(p.getCurrentAttempts() + 1);

                    // Verifica, a partir de todos os palpites deste jogador nesta rodada,
                    // se ele já resolveu cada um dos grids (targetWords).
                    int targets = allResults.size();
                    boolean[] solved = new boolean[targets];

                    for (List<List<String>> guessResults : p.getResults()) {
                        for (int t = 0; t < guessResults.size(); t++) {
                            List<String> statuses = guessResults.get(t);
                            boolean gridSolved = true;
                            for (String s : statuses) {
                                if (!"CORRECT".equals(s)) {
                                    gridSolved = false;
                                    break;
                                }
                            }
                            if (gridSolved) solved[t] = true;
                        }
                    }

                    boolean allSolved = true;
                    for (boolean s : solved) {
                        if (!s) {
                            allSolved = false;
                            break;
                        }
                    }

                    if (allSolved) {
                        p.setWon(true);
                        // record the time only once per round
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
    // Room maximum lifetime in seconds (20 minutes)
    private Long expiration = 1200L;


}