package com.fernando.termoroyale.adapters.out.redis;

import com.fernando.termoroyale.core.domain.Room;
import com.fernando.termoroyale.core.port.RoomRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.Objects;

@Repository
@RequiredArgsConstructor
public class RedisRoomRepositoryAdapter implements RoomRepositoryPort {


    private final RedisTemplate<String, Room> redisTemplate;
    private static final String ROOM_KEY_PREFIX = "room:";

    @Override
    public Room save(Room room) {
        // Salva a sala com TTL de 20 minutos para não sobrecarregar o jogo
        redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + room.getId(), room, 20, TimeUnit.MINUTES);
        return room;
    }

    @Override
    public Optional<Room> findById(String id) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(ROOM_KEY_PREFIX + id));
    }

    @Override
    public Optional<Room> findAvailableRoom() {
        // 1. Primeiro buscamos todas as chaves de salas
        Set<String> keys = redisTemplate.keys(ROOM_KEY_PREFIX + "*");

        if (keys == null || keys.isEmpty()) {
            return Optional.empty();
        }

        // 2. Agora sim usamos o multiGet com as chaves encontradas
        List<Room> allRooms = redisTemplate.opsForValue().multiGet(keys);

        if (allRooms == null) {
            return Optional.empty();
        }

        // 3. Filtramos a primeira sala que ainda não começou e não terminou
        long now = System.currentTimeMillis() / 1000L;
        return allRooms.stream()
                .filter(Objects::nonNull)
                .filter(r -> {
                    // Exclui salas já iniciadas ou finalizadas
                    if (r.isStarted() || r.isFinished()) return false;
                    // Exclui salas com mais de expiration segundos desde criação
                    Long exp = r.getExpiration() != null ? r.getExpiration() : 1200L;
                    return (r.getCreatedAt() + exp) > now;
                })
                .findFirst();
    }

    @Override
    public List<Room> findAll() {
        Set<String> keys = redisTemplate.keys("room:*");
        if (keys == null) return List.of();

        long now = System.currentTimeMillis() / 1000L;
        return keys.stream()
                .map(key -> (Room) redisTemplate.opsForValue().get(key))
                .filter(Objects::nonNull)
                .filter(r -> {
                    Long exp = r.getExpiration() != null ? r.getExpiration() : 1200L;
                    return (r.getCreatedAt() + exp) > now;
                })
                .toList();
    }

}