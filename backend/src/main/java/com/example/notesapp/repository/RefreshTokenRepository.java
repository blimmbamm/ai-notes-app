package com.example.notesapp.repository;

import com.example.notesapp.entity.RefreshTokenEntity;
import com.example.notesapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
    Optional<RefreshTokenEntity> findByToken(String token);
    void deleteByToken(String token);
    void deleteByUser(UserEntity user);
}
