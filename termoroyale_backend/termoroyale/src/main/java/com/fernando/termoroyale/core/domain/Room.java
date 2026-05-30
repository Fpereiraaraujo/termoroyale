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
    // Morte súbita: ativada na fase final após o primeiro acerto.
    // Demais jogadores ainda têm `graceWindowSeconds` segundos para tentar.
    private boolean suddenDeath = false;
    private int graceWindowSeconds = 30;
    private Map<Integer, Map<String, Integer>> roundTimes = new HashMap<>();
    // Histórico de palavras-alvo por fase (para replay na tela de vitória)
    private Map<Integer, List<String>> roundTargets = new HashMap<>();
    // Id da sala de revanche criada a partir desta. Compartilhado entre todos
    // os jogadores da sala original para que cliquem em Revanche e caiam
    // na mesma sala nova.
    private String rematchRoomId;

    public void addPlayer(Player player) {
        this.players.add(player);
    }

    public void updatePlayerProgress(String playerName, String word, List<List<String>> results) {
        players.stream()
                .filter(p -> p.getName().equalsIgnoreCase(playerName))
                .findFirst()
                .ifPresent(p -> {
                    p.getGuesses().add(word);
                    p.getResults().add(results);
                    p.setCurrentAttempts(p.getCurrentAttempts() + 1);

                    // Vitória da FASE = todos os grids foram resolvidos ao longo
                    // das tentativas acumuladas (não numa única palavra). Cada grid
                    // tem seu próprio alvo; o jogador vence quando cada um teve, em
                    // alguma tentativa, todas as letras CORRECT.
                    boolean phaseWon = allGridsSolved(p);

                    if (phaseWon) {
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

    /**
     * Verifica se o jogador resolveu TODOS os grids da fase atual.
     *
     * <p>O histórico de resultados do jogador é {@code [tentativa][grid][letra]}.
     * Um grid está resolvido se em alguma tentativa todas as suas letras vieram
     * CORRECT. A fase é vencida quando todos os grids ({@code targetWords})
     * estão resolvidos.</p>
     */
    private boolean allGridsSolved(Player p) {
        int gridCount = this.targetWords.size();
        if (gridCount == 0) return false;

        for (int grid = 0; grid < gridCount; grid++) {
            boolean solved = false;
            for (List<List<String>> attempt : p.getResults()) {
                if (attempt.size() <= grid) continue;
                List<String> gridResult = attempt.get(grid);
                if (!gridResult.isEmpty() && gridResult.stream().allMatch("CORRECT"::equals)) {
                    solved = true;
                    break;
                }
            }
            if (!solved) return false;
        }
        return true;
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