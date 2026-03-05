package com.example.notesapp.repository;

import com.example.notesapp.entity.NoteEntity;
import com.example.notesapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<NoteEntity, Long> {
    List<NoteEntity> findByUserOrderByUpdatedAtDesc(UserEntity user);
    Optional<NoteEntity> findByIdAndUser(Long id, UserEntity user);
    void deleteByUser(UserEntity user);
}
