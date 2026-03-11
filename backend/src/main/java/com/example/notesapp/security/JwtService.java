package com.example.notesapp.security;

import com.example.notesapp.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateAccessToken(String email) {
        Instant now = Instant.now();
        Instant expiry = now.plus(appProperties.getJwt().getAccessTokenMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(getKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return parseAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String email) {
        String username = extractUsername(token);
        return username.equalsIgnoreCase(email) && !isTokenExpired(token);
    }

    public long accessTokenExpiresInSeconds() {
        return appProperties.getJwt().getAccessTokenMinutes() * 60;
    }

    private boolean isTokenExpired(String token) {
        return parseAllClaims(token).getExpiration().before(new Date());
    }

    private Claims parseAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(appProperties.getJwt().getSecret());
        } catch (Exception ex) {
            keyBytes = appProperties.getJwt().getSecret().getBytes();
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
