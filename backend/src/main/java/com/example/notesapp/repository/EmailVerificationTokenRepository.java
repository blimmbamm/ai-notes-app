package com.example.notesapp.repository;

import com.example.notesapp.entity.EmailVerificationTokenEntity;
import com.example.notesapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity, Long> {
    Optional<EmailVerificationTokenEntity> findByToken(String token);
    void deleteByUser(UserEntity user);
}
