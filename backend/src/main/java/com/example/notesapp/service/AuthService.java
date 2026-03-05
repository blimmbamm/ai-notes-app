package com.example.notesapp.service;

import com.example.notesapp.config.AppProperties;
import com.example.notesapp.dto.AuthResponse;
import com.example.notesapp.dto.LoginRequest;
import com.example.notesapp.dto.LogoutRequest;
import com.example.notesapp.dto.PasswordResetConfirmRequest;
import com.example.notesapp.dto.RefreshRequest;
import com.example.notesapp.dto.SignupRequest;
import com.example.notesapp.entity.EmailVerificationTokenEntity;
import com.example.notesapp.entity.PasswordResetTokenEntity;
import com.example.notesapp.entity.RefreshTokenEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.BadRequestException;
import com.example.notesapp.repository.EmailVerificationTokenRepository;
import com.example.notesapp.repository.PasswordResetTokenRepository;
import com.example.notesapp.repository.RefreshTokenRepository;
import com.example.notesapp.repository.UserRepository;
import com.example.notesapp.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AppProperties appProperties;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       EmailVerificationTokenRepository verificationTokenRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       AppProperties appProperties,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.appProperties = appProperties;
        this.emailService = emailService;
    }

    @Transactional
    public void signup(SignupRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Email is already registered");
        }

        UserEntity user = UserEntity.builder()
                .email(request.email().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .enabled(false)
                .createdAt(Instant.now())
                .build();
        user = userRepository.save(user);

        String token = UUID.randomUUID().toString() + UUID.randomUUID();
        EmailVerificationTokenEntity verificationToken = EmailVerificationTokenEntity.builder()
                .user(user)
                .token(token)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        verificationTokenRepository.save(verificationToken);

        String verifyUrl = appProperties.getFrontendUrl() + "/verify-email?token=" + token;
        emailService.send(user.getEmail(), "Verify your account", "Click this link to verify your account: " + verifyUrl);
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationTokenEntity verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (verificationToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Verification token expired");
        }

        UserEntity user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);
        verificationTokenRepository.deleteByUser(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
        );

        UserEntity user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new BadRequestException("Please verify your email before login");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshTokenEntity refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token expired");
        }

        return issueTokens(refreshToken.getUser());
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenRepository.deleteByToken(request.refreshToken());
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmailIgnoreCase(email.trim().toLowerCase()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            String token = UUID.randomUUID().toString() + UUID.randomUUID();
            PasswordResetTokenEntity resetToken = PasswordResetTokenEntity.builder()
                    .user(user)
                    .token(token)
                    .expiresAt(Instant.now().plus(appProperties.getJwt().getResetTokenMinutes(), ChronoUnit.MINUTES))
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String resetUrl = appProperties.getFrontendUrl() + "/reset-password?token=" + token;
            emailService.send(user.getEmail(), "Reset your password", "Click this link to reset your password: " + resetUrl);
        });
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        PasswordResetTokenEntity resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new BadRequestException("Invalid password reset token"));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadRequestException("Password reset token expired");
        }

        UserEntity user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        refreshTokenRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByUser(user);
    }

    private AuthResponse issueTokens(UserEntity user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshTokenValue = UUID.randomUUID().toString() + UUID.randomUUID();

        RefreshTokenEntity refreshToken = RefreshTokenEntity.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(Instant.now().plus(appProperties.getJwt().getRefreshTokenDays(), ChronoUnit.DAYS))
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshTokenValue,
                "Bearer",
                jwtService.accessTokenExpiresInSeconds());
    }
}
