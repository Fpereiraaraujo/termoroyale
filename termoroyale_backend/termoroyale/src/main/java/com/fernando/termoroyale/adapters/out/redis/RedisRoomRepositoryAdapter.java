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
        // Salva a sala com um tempo de expiração (ex: 1 dia) para não entupir o Redis
        redisTemplate.opsForValue().set(ROOM_KEY_PREFIX + room.getId(), room, 1, TimeUnit.DAYS);
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
        return allRooms.stream()
                .filter(Objects::nonNull) // Garante que não pegamos valores nulos do Redis
                .filter(r -> !r.isStarted() && !r.isFinished())
                .findFirst();
    }

    @Override
    public List<Room> findAll() {
        Set<String> keys = redisTemplate.keys("room:*");
        if (keys == null) return List.of();

        return keys.stream()
                .map(key -> (Room) redisTemplate.opsForValue().get(key))
                .filter(Objects::nonNull)
                .toList();
    }

}