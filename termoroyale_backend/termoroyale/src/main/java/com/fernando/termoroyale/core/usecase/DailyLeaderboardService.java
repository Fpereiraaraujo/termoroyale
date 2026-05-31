package com.fernando.termoroyale.core.usecase;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Leaderboard do Desafio Diário. Persistido em Redis com TTL de 14 dias.
 * Uma submissão por jogador por dia — repetições são ignoradas.
 */
@Service
@RequiredArgsConstructor
public class DailyLeaderboardService {

    private static final Logger log = LoggerFactory.getLogger(DailyLeaderboardService.class);
    private static final int TTL_DAYS = 14;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final StringRedisTemplate redis;

    public record Entry(String playerName, int attempts, int timeSeconds, long timestamp) {}

    private String zsetKey(String date)    { return "daily:lb:zset:" + date; }
    private String entriesKey(String date) { return "daily:lb:entries:" + date; }
    private String firstKey(String date)   { return "daily:lb:first:" + date; }

    public Entry submit(String date, String playerName, int attempts, int timeSeconds) {
        String nameKey = playerName.trim().toLowerCase();
        Entry entry = new Entry(playerName.trim(), attempts, timeSeconds, System.currentTimeMillis());
        String json;
        try { json = MAPPER.writeValueAsString(entry); }
        catch (Exception e) { throw new RuntimeException("Falha ao serializar entrada", e); }

        Boolean inserted = redis.opsForHash().putIfAbsent(entriesKey(date), nameKey, json);
        if (Boolean.FALSE.equals(inserted)) {
            // Jogador já submeteu hoje — retorna o registro existente.
            Object existing = redis.opsForHash().get(entriesKey(date), nameKey);
            if (existing instanceof String s) {
                try { return MAPPER.readValue(s, Entry.class); } catch (Exception ignored) {}
            }
            return entry;
        }

        // Score: tentativas dominam, tempo desempata.
        double score = attempts * 100_000.0 + timeSeconds;
        redis.opsForZSet().add(zsetKey(date), nameKey, score);
        redis.opsForValue().setIfAbsent(firstKey(date), json);

        redis.expire(zsetKey(date),    Duration.ofDays(TTL_DAYS));
        redis.expire(entriesKey(date), Duration.ofDays(TTL_DAYS));
        redis.expire(firstKey(date),   Duration.ofDays(TTL_DAYS));

        log.info("Daily {} {} acertou em {} tentativas / {}s", date, playerName, attempts, timeSeconds);
        return entry;
    }

    public Entry firstSolver(String date) {
        String json = redis.opsForValue().get(firstKey(date));
        if (json == null) return null;
        try { return MAPPER.readValue(json, Entry.class); } catch (Exception e) { return null; }
    }

    public List<Entry> topN(String date, int n) {
        Set<String> names = redis.opsForZSet().range(zsetKey(date), 0, n - 1);
        if (names == null || names.isEmpty()) return List.of();
        List<Object> raws = redis.opsForHash().multiGet(entriesKey(date), new ArrayList<>(names));
        List<Entry> entries = new ArrayList<>();
        for (Object o : raws) {
            if (o instanceof String s) {
                try { entries.add(MAPPER.readValue(s, Entry.class)); } catch (Exception ignored) {}
            }
        }
        entries.sort(Comparator
                .<Entry>comparingInt(Entry::attempts)
                .thenComparingInt(Entry::timeSeconds)
                .thenComparingLong(Entry::timestamp));
        return entries;
    }
}
