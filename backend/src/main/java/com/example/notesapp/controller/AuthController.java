package com.example.notesapp.controller;

import com.example.notesapp.dto.LoginRequest;
import com.example.notesapp.dto.MessageResponse;
import com.example.notesapp.dto.PasswordResetConfirmRequest;
import com.example.notesapp.dto.PasswordResetRequest;
import com.example.notesapp.dto.SignupRequest;
import com.example.notesapp.exception.BadRequestException;
import com.example.notesapp.security.AuthCookieService;
import com.example.notesapp.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    public AuthController(AuthService authService, AuthCookieService authCookieService) {
        this.authService = authService;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/signup")
    public ResponseEntity<MessageResponse> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("Signup successful. Please verify your email."));
    }

    @GetMapping("/verify")
    public MessageResponse verify(@RequestParam String token) {
        authService.verifyEmail(token);
        return new MessageResponse("Email verified successfully");
    }

    @PostMapping("/login")
    public MessageResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        authCookieService.setAuthCookies(response, authService.login(request));
        return new MessageResponse("Login successful");
    }

    @PostMapping("/refresh")
    public MessageResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = authCookieService.readRefreshToken(request)
                .orElseThrow(() -> new BadRequestException("Missing refresh token"));
        authCookieService.setAuthCookies(response, authService.refresh(refreshToken));
        return new MessageResponse("Session refreshed");
    }

    @PostMapping("/logout")
    public MessageResponse logout(HttpServletRequest request, HttpServletResponse response) {
        authCookieService.readRefreshToken(request).ifPresent(authService::logout);
        authCookieService.clearAuthCookies(response);
        authCookieService.clearSessionCookie(response);
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        return new MessageResponse("Logged out");
    }

    @PostMapping("/password-reset/request")
    public MessageResponse requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request.email());
        return new MessageResponse("If the email is registered, a password reset link has been sent.");
    }

    @PostMapping("/password-reset/confirm")
    public MessageResponse confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request);
        return new MessageResponse("Password reset successful");
    }
}
