package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.GuessResponse;
import com.fernando.termoroyale.core.domain.LetterStatus;
import com.fernando.termoroyale.core.domain.Player;
import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import com.fernando.termoroyale.core.port.DictionaryPort;
import com.fernando.termoroyale.core.exception.InvalidWordException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameUseCase {

    private final RoomRepositoryPort roomRepository;
    private final TermoValidator validator;
    private final DictionaryPort dictionaryPort;

    public GuessResponse processGuess(String roomId, String playerName, String word) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Sala não encontrada"));

        if (room.isFinished()) throw new RuntimeException("A partida já terminou!");

        if (!dictionaryPort.isValidWord(word)) {
            throw new InvalidWordException("Palavra '" + word + "' inválida!");
        }

        // 1. Calcula o resultado para TODAS as palavras alvo da rodada
        List<List<String>> allResults = new ArrayList<>();
        boolean allWon = true;

        for (String target : room.getTargetWords()) {
            LetterStatus[] statuses = validator.validate(word, target);
            // Verifica se a palavra atual foi acertada
            boolean wordWon = Arrays.stream(statuses).allMatch(s -> s == LetterStatus.CORRECT);
            if (!wordWon) allWon = false;

            allResults.add(Arrays.stream(statuses).map(Enum::name).toList());
        }

        // 2. Atualiza o jogador com a lista de todos os resultados
        room.updatePlayerProgress(playerName, word, allWon, allResults);

        // 3. Verifica progressão
        checkRoundProgression(room);

        roomRepository.save(room);

        // Retorna o resultado (usamos o primeiro como base para o feedback principal do board)
        return new GuessResponse(word, null, allWon, room.getRemainingAttempts(playerName));
    }

    private void checkRoundProgression(Room room) {

        if (!"PLAYING".equals(room.getStatus())) return;


        long finishedCount = room.getPlayers().stream()
                .filter(p -> p.isWon() || !p.isAlive())
                .count();


        if (finishedCount == room.getPlayers().size()) {
            List<Player> survivors = room.getPlayers().stream()
                    .filter(Player::isWon)
                    .toList();

            if (survivors.isEmpty()) {
                room.setStatus("FINISHED");
                room.setFinished(true);
                return;
            }

            if (room.getCurrentRound() == 1) {
                advanceToRound(room, 2, 2);
            } else if (room.getCurrentRound() == 2) {
                advanceToRound(room, 3, 4);
            } else {
                room.setStatus("FINISHED");
                room.setFinished(true);
            }
        }
    }

    private void advanceToRound(Room room, int nextRound, int wordCount) {
        room.setRound(nextRound);
        room.getTargetWords().clear();
        for (int i = 0; i < wordCount; i++) {
            room.getTargetWords().add(dictionaryPort.getRandomTargetWord());
        }
    }
}