package com.example.notesapp.security;

import com.example.notesapp.config.AppProperties;
import com.example.notesapp.dto.AuthResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.web.util.WebUtils;

import java.time.Duration;
import java.util.Optional;

@Service
public class AuthCookieService {

    private static final String ACCESS_TOKEN_PATH = "/";
    private static final String REFRESH_TOKEN_PATH = "/api/auth";

    private final AppProperties appProperties;

    public AuthCookieService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public void setAuthCookies(HttpServletResponse response, AuthResponse tokens) {
        addCookie(response, appProperties.getAuth().getCookies().getAccessTokenName(),
                tokens.accessToken(), Duration.ofSeconds(tokens.expiresInSeconds()), ACCESS_TOKEN_PATH);

        Duration refreshTtl = Duration.ofDays(appProperties.getJwt().getRefreshTokenDays());
        addCookie(response, appProperties.getAuth().getCookies().getRefreshTokenName(),
                tokens.refreshToken(), refreshTtl, REFRESH_TOKEN_PATH);
    }

    public void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, appProperties.getAuth().getCookies().getAccessTokenName(), ACCESS_TOKEN_PATH);
        clearCookie(response, appProperties.getAuth().getCookies().getRefreshTokenName(), REFRESH_TOKEN_PATH);
    }

    public void clearSessionCookie(HttpServletResponse response) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true)
                .secure(appProperties.getAuth().getCookies().isSecure())
                .sameSite(appProperties.getAuth().getCookies().getSameSite())
                .path("/")
                .maxAge(Duration.ZERO);

        String domain = appProperties.getAuth().getCookies().getDomain();
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public Optional<String> readAccessToken(HttpServletRequest request) {
        return readCookie(request, appProperties.getAuth().getCookies().getAccessTokenName());
    }

    public Optional<String> readRefreshToken(HttpServletRequest request) {
        return readCookie(request, appProperties.getAuth().getCookies().getRefreshTokenName());
    }

    private Optional<String> readCookie(HttpServletRequest request, String name) {
        Cookie cookie = WebUtils.getCookie(request, name);
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return Optional.empty();
        }
        return Optional.of(cookie.getValue());
    }

    private void addCookie(HttpServletResponse response, String name, String value, Duration maxAge, String path) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(appProperties.getAuth().getCookies().isSecure())
                .sameSite(appProperties.getAuth().getCookies().getSameSite())
                .path(path)
                .maxAge(maxAge);

        String domain = appProperties.getAuth().getCookies().getDomain();
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private void clearCookie(HttpServletResponse response, String name, String path) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(appProperties.getAuth().getCookies().isSecure())
                .sameSite(appProperties.getAuth().getCookies().getSameSite())
                .path(path)
                .maxAge(Duration.ZERO);

        String domain = appProperties.getAuth().getCookies().getDomain();
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }
}
