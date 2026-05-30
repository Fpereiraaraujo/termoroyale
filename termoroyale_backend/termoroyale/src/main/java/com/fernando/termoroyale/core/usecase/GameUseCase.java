package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.*;
import com.fernando.termoroyale.core.port.*;
import com.fernando.termoroyale.core.exception.InvalidWordException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
public class GameUseCase {

    private final RoomRepositoryPort roomRepository;
    private final TermoValidator validator;
    private final DictionaryPort dictionaryPort;
    private final SimpMessagingTemplate messagingTemplate;

    private final ScheduledExecutorService advanceScheduler = Executors.newScheduledThreadPool(1);

    public GuessResponse processGuess(String roomId, String playerName, String word) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        if ("FINISHED".equals(room.getStatus())) throw new RuntimeException("Partida encerrada!");
        if (!dictionaryPort.isValidWord(word)) throw new InvalidWordException("Palavra inválida!");

        List<List<String>> allResults = new ArrayList<>();

        for (String target : room.getTargetWords()) {
            LetterStatus[] statuses = validator.validate(word, target);
            allResults.add(Arrays.stream(statuses).map(Enum::name).toList());
        }

        // Atualiza progresso do jogador; a checagem de "ganhou a rodada" é feita
        // agregando todos os palpites do jogador para verificar se ele resolveu
        // todos os grids desta rodada.
        room.updatePlayerProgress(playerName, word, allResults);

        // Verifica se o round avança
        checkRoundProgression(room);

        roomRepository.save(room);

        // Retorna o status atualizado do jogador (se ele foi eliminado ou continua)
        Player currentPlayer = room.getPlayers().stream()
                .filter(p -> p.getName().equalsIgnoreCase(playerName))
                .findFirst().orElseThrow();

        return new GuessResponse(word, null, currentPlayer.isWon(), room.getRemainingAttempts(playerName));
    }

    private void checkRoundProgression(Room room) {
        List<Player> players = room.getPlayers();
        int aliveCount = (int) players.stream().filter(Player::isAlive).count();
        if (aliveCount == 0) return;

        // Cota de sobreviventes baseada no número TOTAL de jogadores que entraram na sala
        // (inclui eliminados). R1 = 2/3, R2 = 1/3, R3 = 1
        int totalPlayers = room.getInitialPlayersCount() > 0 ? room.getInitialPlayersCount() : players.size();
        int quota;
        if (room.getCurrentRound() == 1) {
            quota = Math.max(1, (int) Math.round(totalPlayers * 0.66));
        } else if (room.getCurrentRound() == 2) {
            quota = Math.max(1, (int) Math.round(totalPlayers * 0.33));
        } else {
            quota = 1;
        }

        int round = room.getCurrentRound();
        // sort winners by solved time for this round (earliest first), fallback to fewer guesses
        List<Player> winners = players.stream()
            .filter(Player::isWon)
            .sorted(Comparator.comparingInt((Player p) -> p.getSolvedTimes().getOrDefault(round, Integer.MAX_VALUE))
                .thenComparingInt(p -> p.getGuesses().size()))
            .collect(Collectors.toList());

        // Se a cota foi atingida, o Round ACABA PARA TODOS
        if (winners.size() >= quota) {
            if (room.getCurrentRound() >= 3) {
                room.setStatus("FINISHED");
                room.setFinished(true);
                // Apenas quem ganhou a final permanece vivo (several could tie by time)
                // choose earliest solver if there are multiple
                if (!winners.isEmpty()) {
                    Player best = winners.get(0);
                    players.forEach(p -> p.setAlive(p.equals(best)));
                } else {
                    players.forEach(p -> p.setAlive(false));
                }
            } else {
                // For non-final rounds, first mark pending advance so clients can show winners,
                // then perform the actual elimination/advance after a short grace period.
                if (!room.isPendingAdvance()) {
                    room.setPendingAdvance(true);
                    roomRepository.save(room);
                    messagingTemplate.convertAndSend("/topic/room/" + room.getId(), room);

                    // schedule the actual elimination/advance
                    advanceScheduler.schedule(() -> {
                        try {
                            Room r = roomRepository.findById(room.getId()).orElse(null);
                            if (r == null) return;
                            List<Player> ps = r.getPlayers();
                            int totalPlayersInner = r.getInitialPlayersCount() > 0 ? r.getInitialPlayersCount() : ps.size();
                            int q;
                            if (r.getCurrentRound() == 1) {
                                q = Math.max(1, (int) Math.round(totalPlayersInner * 0.66));
                            } else if (r.getCurrentRound() == 2) {
                                q = Math.max(1, (int) Math.round(totalPlayersInner * 0.33));
                            } else {
                                q = 1;
                            }

                            int roundNum = r.getCurrentRound();
                            List<Player> ws = ps.stream()
                                    .filter(Player::isWon)
                                    .sorted(Comparator.comparingInt((Player p) -> p.getSolvedTimes().getOrDefault(roundNum, Integer.MAX_VALUE))
                                            .thenComparingInt(p -> p.getGuesses().size()))
                                    .collect(Collectors.toList());

                            if (ws.size() >= q) {
                                if (roundNum >= 3) {
                                    r.setStatus("FINISHED");
                                    r.setFinished(true);
                                    if (!ws.isEmpty()) {
                                        Player best = ws.get(0);
                                        ps.forEach(p -> p.setAlive(p.equals(best)));
                                    } else {
                                        ps.forEach(p -> p.setAlive(false));
                                    }
                                } else {
                                    ps.forEach(p -> {
                                        if (!ws.contains(p) || ws.indexOf(p) >= q) {
                                            p.setAlive(false);
                                            p.setWon(false);
                                        } else {
                                            p.setWon(false);
                                            p.setCurrentAttempts(0);
                                            p.setGuesses(new ArrayList<>());
                                            p.setResults(new ArrayList<>());
                                            p.setAlive(true);
                                        }
                                    });
                                    advanceToRound(r, r.getCurrentRound() + 1, r.getCurrentRound() == 1 ? 2 : 4);
                                }
                            }

                            r.setPendingAdvance(false);
                            roomRepository.save(r);
                            messagingTemplate.convertAndSend("/topic/room/" + r.getId(), r);
                        } catch (Exception ex) {
                            ex.printStackTrace();
                        }
                    }, 1500, TimeUnit.MILLISECONDS);
                }
            }
        }
    }

    // Called by timer when a phase expires (time runs out)
    public void onPhaseTimeout(String roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        List<Player> players = room.getPlayers();
        int round = room.getCurrentRound();

        int totalPlayers = room.getInitialPlayersCount() > 0 ? room.getInitialPlayersCount() : players.size();
        int quota;
        if (round == 1) {
            quota = Math.max(1, (int) Math.round(totalPlayers * 0.66));
        } else if (round == 2) {
            quota = Math.max(1, (int) Math.round(totalPlayers * 0.33));
        } else {
            quota = 1;
        }

        // winners who solved all targets
        List<Player> winners = players.stream()
                .filter(Player::isWon)
                .sorted(Comparator.comparingInt(p -> p.getSolvedTimes().getOrDefault(round, Integer.MAX_VALUE)))
                .collect(Collectors.toList());

        if (winners.size() >= quota) {
            // enough winners -> proceed with normal progression
            checkRoundProgression(room);
            roomRepository.save(room);
            return;
        }

        // not enough winners; select top players by number of solved targets (partial progress)
        List<Player> alivePlayers = players.stream().filter(Player::isAlive).collect(Collectors.toList());

        Map<Player, Integer> solvedCount = new HashMap<>();
        for (Player p : alivePlayers) {
            int targets = room.getTargetWords().size();
            boolean[] solved = new boolean[targets];
            for (List<List<String>> guessResults : p.getResults()) {
                for (int t = 0; t < guessResults.size(); t++) {
                    List<String> statuses = guessResults.get(t);
                    boolean gridSolved = true;
                    for (String s : statuses) {
                        if (!"CORRECT".equals(s)) { gridSolved = false; break; }
                    }
                    if (gridSolved) solved[t] = true;
                }
            }
            int count = 0;
            for (boolean s : solved) if (s) count++;
            solvedCount.put(p, count);
        }

        List<Player> selected = alivePlayers.stream()
                .sorted(Comparator.comparingInt((Player p) -> solvedCount.getOrDefault(p, 0)).reversed()
                        .thenComparingInt(p -> p.getSolvedTimes().getOrDefault(round, Integer.MAX_VALUE))
                        .thenComparingInt(Player::getCurrentAttempts))
                .limit(quota)
                .collect(Collectors.toList());

        // Apply elimination/advancement using selected as winners
        if (round >= 3) {
            room.setStatus("FINISHED");
            room.setFinished(true);
            // only the first selected wins
            if (!selected.isEmpty()) {
                Player winner = selected.get(0);
                players.forEach(p -> p.setAlive(p.equals(winner)));
            } else {
                players.forEach(p -> p.setAlive(false));
            }
        } else {
            players.forEach(p -> {
                if (!selected.contains(p) || selected.indexOf(p) >= quota) {
                    p.setAlive(false);
                    p.setWon(false);
                } else {
                    p.setWon(false);
                    p.setCurrentAttempts(0);
                    p.setGuesses(new ArrayList<>());
                    p.setResults(new ArrayList<>());
                    p.setAlive(true);
                }
            });
            advanceToRound(room, room.getCurrentRound() + 1, room.getCurrentRound() == 1 ? 2 : 4);
        }

        roomRepository.save(room);
    }

    private void advanceToRound(Room room, int nextRound, int wordCount) {
        room.setRound(nextRound);
        room.getTargetWords().clear();
        for (int i = 0; i < wordCount; i++) {
            room.getTargetWords().add(dictionaryPort.getRandomTargetWord());
        }
        room.setTimeLeft(room.getPhaseDuration());
        room.setPhaseStartTimestamp(System.currentTimeMillis() / 1000L);
    }
}