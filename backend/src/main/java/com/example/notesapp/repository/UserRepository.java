package com.example.notesapp.repository;

import com.example.notesapp.entity.AuthProvider;
import com.example.notesapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    Optional<UserEntity> findByAuthProviderAndProviderUserId(AuthProvider authProvider, String providerUserId);
    boolean existsByEmailIgnoreCase(String email);
}
