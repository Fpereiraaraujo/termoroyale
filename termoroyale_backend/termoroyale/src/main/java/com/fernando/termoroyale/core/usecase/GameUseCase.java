package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.*;
import com.fernando.termoroyale.core.port.*;
import com.fernando.termoroyale.core.exception.InvalidWordException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameUseCase {

    private static final Logger log = LoggerFactory.getLogger(GameUseCase.class);

    private final RoomRepositoryPort roomRepository;
    private final TermoValidator validator;
    private final DictionaryPort dictionaryPort;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomLockRegistry lockRegistry;

    public GuessResponse processGuess(String roomId, String playerName, String word) {
        java.util.concurrent.locks.Lock lock = lockRegistry.lockFor(roomId);
        lock.lock();
        try {
            return doProcessGuess(roomId, playerName, word);
        } finally {
            lock.unlock();
        }
    }

    private GuessResponse doProcessGuess(String roomId, String playerName, String word) {
        log.info(">>> [PROCESS GUESS] Sala: {} | Jogador: {} | Palavra: {}", roomId, playerName, word);

        Room room = roomRepository.findById(roomId).orElseThrow();

        if ("FINISHED".equals(room.getStatus())) {
            log.warn("Tentativa em sala finalizada: {}", roomId);
            throw new RuntimeException("Partida encerrada!");
        }

        if (!dictionaryPort.isValidWord(word)) {
            log.warn("Palavra inválida: {}", word);
            throw new InvalidWordException("Palavra inválida!");
        }

        List<List<String>> allResults = new ArrayList<>();

        for (String target : room.getTargetWords()) {
            LetterStatus[] statuses = validator.validate(word, target);
            allResults.add(Arrays.stream(statuses).map(Enum::name).toList());
        }

        room.updatePlayerProgress(playerName, word, allResults);

        checkRoundProgression(room);

        roomRepository.save(room);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, room);

        Player currentPlayer = room.getPlayers().stream()
                .filter(p -> p.getName().equalsIgnoreCase(playerName))
                .findFirst().orElseThrow();

        return new GuessResponse(word, null, currentPlayer.isWon(), room.getRemainingAttempts(playerName));
    }

    public void onPhaseTimeout(String roomId) {
        java.util.concurrent.locks.Lock lock = lockRegistry.lockFor(roomId);
        lock.lock();
        try {
            log.info(">>> [TIMEOUT] Tempo esgotado para sala: {}", roomId);
            Room room = roomRepository.findById(roomId).orElseThrow();

            if (!"FINISHED".equals(room.getStatus())) {
                room.getPlayers().stream()
                        .filter(p -> p.isAlive() && !p.isWon())
                        .forEach(p -> {
                            log.info("Jogador {} eliminado por timeout", p.getName());
                            p.setAlive(false);
                        });

                checkRoundProgression(room);

                // Fase final SEMPRE encerra no timeout (mesmo sem vencedor)
                if (room.getCurrentRound() >= 3 && !"FINISHED".equals(room.getStatus())) {
                    log.info(">>> [TIMEOUT] Fase final encerrada por tempo.");
                    room.setStatus("FINISHED");
                    room.setFinished(true);
                }

                roomRepository.save(room);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, room);
            }
        } finally {
            lock.unlock();
        }
    }

    private void checkRoundProgression(Room room) {
        List<Player> alivePlayers = room.getPlayers().stream().filter(Player::isAlive).collect(Collectors.toList());
        int aliveCount = alivePlayers.size();

        log.info("--- [CHECK PROGRESS] Sala: {} | Round: {} | Jogadores vivos: {}", room.getId(), room.getCurrentRound(), aliveCount);

        if (aliveCount == 0) return;

        List<Player> winners = alivePlayers.stream()
                .filter(Player::isWon)
                .sorted(Comparator.comparingInt(p -> p.getSolvedTimes().getOrDefault(room.getCurrentRound(), 9999)))
                .collect(Collectors.toList());

        // Fase FINAL: morte súbita em vez de fim imediato.
        if (room.getCurrentRound() >= 3) {
            if (winners.isEmpty()) return; // ninguém venceu ainda — segue jogando

            if (!room.isSuddenDeath()) {
                room.setSuddenDeath(true);
                int grace = room.getGraceWindowSeconds() > 0 ? room.getGraceWindowSeconds() : 30;
                if (room.getTimeLeft() > grace) {
                    room.setTimeLeft(grace);
                }
                log.info(">>> [SUDDEN DEATH] Ativada na sala {} — {}s para os demais reagirem",
                        room.getId(), room.getTimeLeft());
            }

            // Só finaliza quando todos os vivos já decidiram (todos venceram).
            // Quem esgotou tentativas já saiu de `alivePlayers` via updatePlayerProgress.
            if (alivePlayers.stream().allMatch(Player::isWon)) {
                log.info(">>> [SUDDEN DEATH] Todos os vivos resolveram — encerrando partida.");
                room.setStatus("FINISHED");
                room.setFinished(true);
            }
            return;
        }

        int quota = (room.getCurrentRound() == 1) ? Math.max(1, (int) Math.ceil(aliveCount * 0.75))
                : Math.max(1, (int) Math.ceil(aliveCount * 0.50));

        log.info("Vencedores atuais na rodada: {} | Quota necessária: {}", winners.size(), quota);

        if (winners.size() >= quota || (winners.size() == aliveCount && aliveCount > 0)) {
            log.info(">>> [AVANÇANDO RODADA] Condição atingida!");
            playersElimination(room, winners, quota);
        }
    }

    private void playersElimination(Room room, List<Player> winners, int quota) {
        room.getPlayers().forEach(p -> {
            if (p.isAlive()) {
                if (!winners.contains(p) || winners.indexOf(p) >= quota) {
                    log.info("Jogador {} ELIMINADO", p.getName());
                    p.setAlive(false);
                } else {
                    log.info("Jogador {} SOBREVIVEU (Avança para próxima fase)", p.getName());
                    p.setWon(false);
                    p.setCurrentAttempts(0);
                    p.getGuesses().clear();
                    p.getResults().clear();
                }
            }
        });

        int nextRound = room.getCurrentRound() + 1;
        log.info("Preparando Round: {}", nextRound);
        advanceToPhase(room, nextRound, (nextRound == 2) ? 2 : 4);
    }

    private void advanceToPhase(Room room, int nextRound, int wordCount) {
        room.setCurrentRound(nextRound);
        room.getTargetWords().clear();
        for (int i = 0; i < wordCount; i++) {
            room.getTargetWords().add(dictionaryPort.getRandomTargetWord());
        }
        room.getRoundTargets().put(nextRound, new ArrayList<>(room.getTargetWords()));
        room.setTimeLeft(room.getPhaseDuration());

        // Handicap dinâmico: ao entrar no Round 3, o líder do Round 2
        // (menor tempo de resolução) começa com 1 tentativa a menos.
        if (nextRound == 3) {
            int previousRound = nextRound - 1;
            room.getPlayers().stream()
                    .filter(Player::isAlive)
                    .filter(p -> p.getSolvedTimes().containsKey(previousRound))
                    .min(Comparator.comparingInt(p -> p.getSolvedTimes().get(previousRound)))
                    .ifPresent(leader -> {
                        leader.setCurrentAttempts(1);
                        log.info(">>> [HANDICAP R3] Líder da R2 ({}) começa o Round 3 com 1 tentativa a menos",
                                leader.getName());
                    });
        }

        log.info("Sala {} avançou para Round {} com {} palavras alvo.", room.getId(), nextRound, wordCount);
    }
}