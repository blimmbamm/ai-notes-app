package com.example.notesapp.security;

import com.example.notesapp.config.AppProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private AppProperties appProperties;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getJwt().setAccessTokenMinutes(15);
        appProperties.getJwt().setSecret(Base64.getEncoder().encodeToString("12345678901234567890123456789012".getBytes()));
    }

    @Test
    void generateAndExtractUsernameRoundTrip() {
        JwtService jwtService = new JwtService(appProperties);

        String token = jwtService.generateAccessToken("user@example.com");

        assertEquals("user@example.com", jwtService.extractUsername(token));
    }

    @Test
    void isTokenValidMatchesCaseInsensitiveEmailAndRejectsMismatches() {
        JwtService jwtService = new JwtService(appProperties);
        String token = jwtService.generateAccessToken("User@Example.com");

        assertTrue(jwtService.isTokenValid(token, "user@example.com"));
        assertFalse(jwtService.isTokenValid(token, "other@example.com"));
    }

    @Test
    void accessTokenExpiryInSecondsUsesConfiguredMinutes() {
        JwtService jwtService = new JwtService(appProperties);

        assertEquals(900L, jwtService.accessTokenExpiresInSeconds());
    }

    @Test
    void supportsRawSecretWhenNotBase64Encoded() {
        appProperties.getJwt().setSecret("raw-secret-key-with-32-bytes-min-!!!!");
        JwtService jwtService = new JwtService(appProperties);

        String token = jwtService.generateAccessToken("u@example.com");

        assertEquals("u@example.com", jwtService.extractUsername(token));
    }
}
