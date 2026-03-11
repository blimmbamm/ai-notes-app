package com.example.notesapp.integration;

import com.example.notesapp.entity.RefreshTokenEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.RefreshTokenRepository;
import com.example.notesapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthLoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void loginReturnsTokensAndPersistsRefreshToken() throws Exception {
        UserEntity user = userRepository.save(UserEntity.builder()
                .email("login@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .enabled(true)
                .createdAt(Instant.now())
                .build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresInSeconds").isNumber());

        List<RefreshTokenEntity> tokens = refreshTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getUser().getId()).isEqualTo(user.getId());
        assertThat(tokens.get(0).getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void loginRejectsInvalidPassword() throws Exception {
        userRepository.save(UserEntity.builder()
                .email("login@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .enabled(true)
                .createdAt(Instant.now())
                .build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@example.com\",\"password\":\"wrong-pass\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }
}
