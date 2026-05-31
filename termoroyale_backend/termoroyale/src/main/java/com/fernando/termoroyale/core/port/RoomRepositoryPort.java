package com.fernando.termoroyale.core.port;

import com.fernando.termoroyale.core.domain.Room;

import java.util.List;
import java.util.Optional;

public interface RoomRepositoryPort {
    Room save(Room room);
    Optional<Room> findById(String id);
    Optional<Room> findAvailableRoom();
    List<Room> findAll();
    long countActive();
}