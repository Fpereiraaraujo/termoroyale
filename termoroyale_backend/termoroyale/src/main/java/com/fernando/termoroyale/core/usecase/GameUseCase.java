package com.fernando.termoroyale.core.usecase;

import com.fernando.termoroyale.core.domain.*;
import com.fernando.termoroyale.core.port.*;
import com.fernando.termoroyale.core.exception.InvalidWordException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameUseCase {
    private final RoomRepositoryPort roomRepository;
    private final TermoValidator validator;
    private final DictionaryPort dictionaryPort;

    public GuessResponse processGuess(String roomId, String playerName, String word) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        if (!dictionaryPort.isValidWord(word)) throw new InvalidWordException("Palavra inválida!");

        List<List<String>> allResults = new ArrayList<>();
        boolean allGridsWon = true;

        for (String target : room.getTargetWords()) {
            LetterStatus[] statuses = validator.validate(word, target);
            boolean gridWon = Arrays.stream(statuses).allMatch(s -> s == LetterStatus.CORRECT);
            if (!gridWon) allGridsWon = false;
            allResults.add(Arrays.stream(statuses).map(Enum::name).toList());
        }

        room.updatePlayerProgress(playerName, word, allGridsWon, allResults);
        checkRoundProgression(room);
        roomRepository.save(room);

        return new GuessResponse(word, null, allGridsWon, room.getRemainingAttempts(playerName));
    }

    private void checkRoundProgression(Room room) {
        List<Player> players = room.getPlayers();
        long finishedCount = players.stream().filter(p -> p.isWon() || !p.isAlive()).count();

        if (finishedCount >= players.size()) {
            List<Player> winners = players.stream()
                    .filter(Player::isWon)
                    .sorted(Comparator.comparingInt(p -> p.getGuesses().size()))
                    .toList();

            if (winners.isEmpty()) {
                room.setStatus("FINISHED");
                room.setFinished(true);
            } else {
                int total = players.size();
                int cut = (room.getCurrentRound() == 1) ? (total * 2 / 3) : (total / 3);
                final int finalCut = Math.max(1, cut);

                players.forEach(p -> {
                    if (!winners.contains(p) || winners.indexOf(p) >= finalCut) {
                        p.setAlive(false);
                        p.setWon(false);
                    } else {
                        p.setWon(false); // Reset para próxima rodada
                        p.setCurrentAttempts(0);
                        p.setGuesses(new ArrayList<>());
                        p.setResults(new ArrayList<>());
                    }
                });
                advanceToRound(room, room.getCurrentRound() + 1, room.getCurrentRound() == 1 ? 2 : 4);
            }
        }
    }

    private void advanceToRound(Room room, int nextRound, int wordCount) {
        room.setRound(nextRound);
        room.getTargetWords().clear();
        for (int i = 0; i < wordCount; i++) room.getTargetWords().add(dictionaryPort.getRandomTargetWord());
    }
}