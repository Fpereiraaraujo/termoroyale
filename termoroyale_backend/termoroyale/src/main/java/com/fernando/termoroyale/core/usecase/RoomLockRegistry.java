package com.fernando.termoroyale.core.usecase;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Fornece um lock por sala para serializar o ciclo read-modify-write no Redis.
 *
 * <p>Como o timer (agendado a cada segundo) e os palpites dos jogadores
 * podem alterar a mesma sala concorrentemente, sem coordenação ocorre
 * lost update: uma escrita sobrescreve a outra. Este registro garante que
 * apenas uma operação por sala execute por vez.</p>
 */
@Component
public class RoomLockRegistry {

    private final ConcurrentHashMap<String, Lock> locks = new ConcurrentHashMap<>();

    public Lock lockFor(String roomId) {
        return locks.computeIfAbsent(roomId, k -> new ReentrantLock());
    }

    public void release(String roomId) {
        locks.remove(roomId);
    }
}
