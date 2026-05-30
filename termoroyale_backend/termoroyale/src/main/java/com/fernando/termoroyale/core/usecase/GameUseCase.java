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

    public GuessResponse processGuess(String roomId, String playerName, String word) {
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
        boolean allGridsWon = true;

        for (String target : room.getTargetWords()) {
            LetterStatus[] statuses = validator.validate(word, target);
            boolean gridWon = Arrays.stream(statuses).allMatch(s -> s == LetterStatus.CORRECT);
            if (!gridWon) allGridsWon = false;
            allResults.add(Arrays.stream(statuses).map(Enum::name).toList());
        }

        log.info("Jogador {} | Status de Vitória: {}", playerName, allGridsWon);
        room.updatePlayerProgress(playerName, word, allGridsWon, allResults);

        checkRoundProgression(room);

        roomRepository.save(room);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, room);

        Player currentPlayer = room.getPlayers().stream()
                .filter(p -> p.getName().equalsIgnoreCase(playerName))
                .findFirst().orElseThrow();

        return new GuessResponse(word, null, currentPlayer.isWon(), room.getRemainingAttempts(playerName));
    }

    public void onPhaseTimeout(String roomId) {
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
            roomRepository.save(room);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, room);
        }
    }

    private void checkRoundProgression(Room room) {
        List<Player> alivePlayers = room.getPlayers().stream().filter(Player::isAlive).collect(Collectors.toList());
        int aliveCount = alivePlayers.size();

        log.info("--- [CHECK PROGRESS] Sala: {} | Round: {} | Jogadores vivos: {}", room.getId(), room.getCurrentRound(), aliveCount);

        if (aliveCount == 0) return;

        int quota = (room.getCurrentRound() == 1) ? Math.max(1, (int) Math.ceil(aliveCount * 0.75))
                : (room.getCurrentRound() == 2) ? Math.max(1, (int) Math.ceil(aliveCount * 0.50))
                  : 1;

        List<Player> winners = alivePlayers.stream()
                .filter(Player::isWon)
                .sorted(Comparator.comparingInt(p -> p.getSolvedTimes().getOrDefault(room.getCurrentRound(), 9999)))
                .collect(Collectors.toList());

        log.info("Vencedores atuais na rodada: {} | Quota necessária: {}", winners.size(), quota);

        if (winners.size() >= quota || (winners.size() == aliveCount && aliveCount > 0)) {
            log.info(">>> [AVANÇANDO/FINALIZANDO RODADA] Condição atingida!");

            if (room.getCurrentRound() >= 3) {
                log.info("Fim de jogo! Definindo status FINISHED.");
                room.setStatus("FINISHED");
                room.setFinished(true);
            } else {
                playersElimination(room, winners, quota);
            }
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
        room.setTimeLeft(room.getPhaseDuration());
        log.info("Sala {} avançou para Round {} com {} palavras alvo.", room.getId(), nextRound, wordCount);
    }
}