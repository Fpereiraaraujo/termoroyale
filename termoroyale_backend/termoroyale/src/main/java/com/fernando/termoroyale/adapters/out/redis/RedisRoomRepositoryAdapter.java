package com.fernando.termoroyale.adapters.out.redis;

import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Repository
@RequiredArgsConstructor
public class RedisRoomRepositoryAdapter implements RoomRepositoryPort {

    private final RedisTemplate<String, Room> redisTemplate;
    private static final String ROOM_KEY_PREFIX = "room:";
    private static final String SCAN_PATTERN = ROOM_KEY_PREFIX + "*";
    private static final int SCAN_BATCH = 200;

    @Override
    public Room save(Room room) {
        redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + room.getId(), room, 20, TimeUnit.MINUTES);
        return room;
    }

    @Override
    public Optional<Room> findById(String id) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(ROOM_KEY_PREFIX + id));
    }

    @Override
    public Optional<Room> findAvailableRoom() {
        long now = System.currentTimeMillis() / 1000L;
        for (Room r : scanAll()) {
            if (r.isStarted() || r.isFinished() || !"WAITING".equals(r.getStatus())) continue;
            Long exp = r.getExpiration() != null ? r.getExpiration() : 1200L;
            if ((r.getCreatedAt() + exp) > now) return Optional.of(r);
        }
        return Optional.empty();
    }

    @Override
    public List<Room> findAll() {
        long now = System.currentTimeMillis() / 1000L;
        List<Room> out = new ArrayList<>();
        for (Room r : scanAll()) {
            Long exp = r.getExpiration() != null ? r.getExpiration() : 1200L;
            if ((r.getCreatedAt() + exp) > now) out.add(r);
        }
        return out;
    }

    @Override
    public long countActive() {
        long now = System.currentTimeMillis() / 1000L;
        long c = 0;
        for (Room r : scanAll()) {
            Long exp = r.getExpiration() != null ? r.getExpiration() : 1200L;
            if ((r.getCreatedAt() + exp) > now) c++;
        }
        return c;
    }

    /**
     * Itera as chaves de sala com SCAN (não bloqueante) e busca os valores
     * em lote via multiGet. Substitui o uso de KEYS, que é O(N) bloqueante
     * e inadequado para produção.
     */
    private List<Room> scanAll() {
        List<String> keys = new ArrayList<>();
        ScanOptions opts = ScanOptions.scanOptions().match(SCAN_PATTERN).count(SCAN_BATCH).build();
        try (Cursor<String> cursor = redisTemplate.scan(opts)) {
            while (cursor.hasNext()) keys.add(cursor.next());
        } catch (Exception e) {
            return Collections.emptyList();
        }
        if (keys.isEmpty()) return Collections.emptyList();
        List<Room> values = redisTemplate.opsForValue().multiGet(keys);
        if (values == null) return Collections.emptyList();
        values.removeIf(Objects::isNull);
        return values;
    }
}