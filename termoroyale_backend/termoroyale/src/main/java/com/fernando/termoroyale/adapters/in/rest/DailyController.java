package com.fernando.termoroyale.adapters.in.rest;

import com.fernando.termoroyale.core.usecase.DailyLeaderboardService;
import com.fernando.termoroyale.core.usecase.DailyLeaderboardService.Entry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/daily")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DailyController {

    private final DailyLeaderboardService leaderboard;

    public record SubmitRequest(String playerName, Integer attempts, Integer timeSeconds) {}

    @PostMapping("/submit")
    public Map<String, Object> submit(@RequestBody SubmitRequest req) {
        if (req == null || req.playerName() == null || req.playerName().trim().length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome inválido");
        }
        if (req.attempts() == null || req.attempts() < 1 || req.attempts() > 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tentativas inválidas");
        }
        int seconds = req.timeSeconds() == null ? 0 : Math.max(0, Math.min(60 * 60 * 24, req.timeSeconds()));
        String date = LocalDate.now(ZoneOffset.UTC).toString();
        Entry mine = leaderboard.submit(date, req.playerName(), req.attempts(), seconds);
        return buildPayload(date, mine);
    }

    @GetMapping("/leaderboard")
    public Map<String, Object> leaderboard() {
        String date = LocalDate.now(ZoneOffset.UTC).toString();
        return buildPayload(date, null);
    }

    private Map<String, Object> buildPayload(String date, Entry mine) {
        Entry first = leaderboard.firstSolver(date);
        List<Entry> top = leaderboard.topN(date, 10);
        Map<String, Object> payload = new HashMap<>();
        payload.put("date", date);
        payload.put("firstSolver", first);
        payload.put("top", top);
        if (mine != null) payload.put("yourEntry", mine);
        return payload;
    }
}
