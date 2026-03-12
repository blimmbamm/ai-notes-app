package com.example.notesapp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Default
    @Column(nullable = false)
    private String passwordHash = "";

    @Enumerated(EnumType.STRING)
    @Default
    @Column(nullable = false)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column
    private String providerUserId;

    @Default
    @Column(nullable = false)
    private boolean enabled = false;

    @Column(nullable = false)
    @Default()
    private Instant createdAt =  Instant.now();
}
