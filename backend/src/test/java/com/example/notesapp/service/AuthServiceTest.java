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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailVerificationTokenRepository verificationTokenRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    private AppProperties appProperties;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.setFrontendUrl("https://frontend.example.com");
        appProperties.getJwt().setRefreshTokenDays(14);
        appProperties.getJwt().setResetTokenMinutes(60);
        authService = new AuthService(
                userRepository,
                verificationTokenRepository,
                refreshTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                appProperties,
                emailService
        );
    }

    @Test
    void signupThrowsWhenEmailAlreadyExists() {
        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> authService.signup(new SignupRequest("dup@example.com", "password123")));

        verify(userRepository, never()).save(any(UserEntity.class));
        verify(verificationTokenRepository, never()).save(any(EmailVerificationTokenEntity.class));
    }

    @Test
    void signupCreatesDisabledUserVerificationTokenAndEmail() {
        when(userRepository.existsByEmailIgnoreCase("  TEST@example.com ")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.signup(new SignupRequest("  TEST@example.com ", "password123"));

        ArgumentCaptor<UserEntity> userCaptor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(userCaptor.capture());
        UserEntity savedUser = userCaptor.getValue();
        assertEquals("test@example.com", savedUser.getEmail());
        assertEquals("hashed", savedUser.getPasswordHash());
        assertTrue(!savedUser.isEnabled());
        assertNotNull(savedUser.getCreatedAt());

        ArgumentCaptor<EmailVerificationTokenEntity> tokenCaptor = ArgumentCaptor.forClass(EmailVerificationTokenEntity.class);
        verify(verificationTokenRepository).save(tokenCaptor.capture());
        EmailVerificationTokenEntity verificationToken = tokenCaptor.getValue();
        assertEquals(savedUser, verificationToken.getUser());
        assertNotNull(verificationToken.getToken());
        assertTrue(verificationToken.getToken().length() > 36);
        assertTrue(verificationToken.getExpiresAt().isAfter(Instant.now().minus(1, ChronoUnit.MINUTES)));

        verify(emailService).send(eq("test@example.com"), eq("Verify your account"), anyString());
    }

    @Test
    void verifyEmailThrowsWhenTokenInvalid() {
        when(verificationTokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> authService.verifyEmail("bad"));

        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void verifyEmailThrowsWhenTokenExpired() {
        UserEntity user = UserEntity.builder().email("u@example.com").enabled(false).build();
        EmailVerificationTokenEntity token = EmailVerificationTokenEntity.builder()
                .user(user)
                .token("expired")
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        when(verificationTokenRepository.findByToken("expired")).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> authService.verifyEmail("expired"));

        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void verifyEmailEnablesUserAndDeletesTokenForUser() {
        UserEntity user = UserEntity.builder().email("u@example.com").enabled(false).build();
        EmailVerificationTokenEntity token = EmailVerificationTokenEntity.builder()
                .user(user)
                .token("ok")
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .build();
        when(verificationTokenRepository.findByToken("ok")).thenReturn(Optional.of(token));

        authService.verifyEmail("ok");

        assertTrue(user.isEnabled());
        verify(userRepository).save(user);
        verify(verificationTokenRepository).deleteByUser(user);
    }

    @Test
    void loginThrowsWhenUserDisabled() {
        UserEntity user = UserEntity.builder().email("u@example.com").enabled(false).build();
        when(userRepository.findByEmailIgnoreCase(" U@Example.com ")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class,
                () -> authService.login(new LoginRequest(" U@Example.com ", "password")));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(refreshTokenRepository, never()).save(any(RefreshTokenEntity.class));
    }

    @Test
    void loginReturnsAuthResponseForEnabledUser() {
        UserEntity user = UserEntity.builder().email("u@example.com").enabled(true).build();
        when(userRepository.findByEmailIgnoreCase("u@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken("u@example.com")).thenReturn("access-token");
        when(jwtService.accessTokenExpiresInSeconds()).thenReturn(900L);

        AuthResponse response = authService.login(new LoginRequest("u@example.com", "password"));

        assertEquals("access-token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(900L, response.expiresInSeconds());
        assertNotNull(response.refreshToken());
        verify(refreshTokenRepository).save(any(RefreshTokenEntity.class));
    }

    @Test
    void refreshThrowsWhenTokenInvalid() {
        when(refreshTokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> authService.refresh(new RefreshRequest("bad")));
    }

    @Test
    void refreshDeletesAndThrowsWhenExpired() {
        UserEntity user = UserEntity.builder().email("u@example.com").enabled(true).build();
        RefreshTokenEntity refreshToken = RefreshTokenEntity.builder()
                .user(user)
                .token("expired")
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        when(refreshTokenRepository.findByToken("expired")).thenReturn(Optional.of(refreshToken));

        assertThrows(BadRequestException.class, () -> authService.refresh(new RefreshRequest("expired")));

        verify(refreshTokenRepository).delete(refreshToken);
    }

    @Test
    void refreshReturnsNewTokensWhenRefreshTokenValid() {
        UserEntity user = UserEntity.builder().email("u@example.com").enabled(true).build();
        RefreshTokenEntity refreshToken = RefreshTokenEntity.builder()
                .user(user)
                .token("valid")
                .expiresAt(Instant.now().plus(1, ChronoUnit.DAYS))
                .build();
        when(refreshTokenRepository.findByToken("valid")).thenReturn(Optional.of(refreshToken));
        when(jwtService.generateAccessToken("u@example.com")).thenReturn("access-token");
        when(jwtService.accessTokenExpiresInSeconds()).thenReturn(900L);

        AuthResponse response = authService.refresh(new RefreshRequest("valid"));

        assertEquals("access-token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertNotNull(response.refreshToken());
        verify(refreshTokenRepository).save(any(RefreshTokenEntity.class));
    }

    @Test
    void logoutDeletesTokenByValue() {
        authService.logout(new LogoutRequest("rt-1"));

        verify(refreshTokenRepository).deleteByToken("rt-1");
    }

    @Test
    void requestPasswordResetCreatesTokenAndSendsEmailWhenUserExists() {
        UserEntity user = UserEntity.builder().email("u@example.com").build();
        when(userRepository.findByEmailIgnoreCase("u@example.com")).thenReturn(Optional.of(user));

        authService.requestPasswordReset("  U@Example.com ");

        verify(passwordResetTokenRepository).deleteByUser(user);
        verify(passwordResetTokenRepository).save(any(PasswordResetTokenEntity.class));
        verify(emailService).send(eq("u@example.com"), eq("Reset your password"), anyString());
    }

    @Test
    void requestPasswordResetDoesNothingWhenUserMissing() {
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        authService.requestPasswordReset("missing@example.com");

        verify(passwordResetTokenRepository, never()).save(any(PasswordResetTokenEntity.class));
        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void confirmPasswordResetThrowsWhenTokenInvalid() {
        when(passwordResetTokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class,
                () -> authService.confirmPasswordReset(new PasswordResetConfirmRequest("bad", "password123")));

        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void confirmPasswordResetDeletesExpiredTokenAndThrows() {
        UserEntity user = UserEntity.builder().email("u@example.com").build();
        PasswordResetTokenEntity token = PasswordResetTokenEntity.builder()
                .user(user)
                .token("expired")
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        when(passwordResetTokenRepository.findByToken("expired")).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class,
                () -> authService.confirmPasswordReset(new PasswordResetConfirmRequest("expired", "password123")));

        verify(passwordResetTokenRepository).delete(token);
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void confirmPasswordResetUpdatesPasswordAndCleansTokens() {
        UserEntity user = UserEntity.builder().email("u@example.com").build();
        PasswordResetTokenEntity token = PasswordResetTokenEntity.builder()
                .user(user)
                .token("ok")
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .build();
        when(passwordResetTokenRepository.findByToken("ok")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("password123")).thenReturn("new-hash");

        authService.confirmPasswordReset(new PasswordResetConfirmRequest("ok", "password123"));

        assertEquals("new-hash", user.getPasswordHash());
        verify(userRepository).save(user);
        verify(refreshTokenRepository).deleteByUser(user);
        verify(passwordResetTokenRepository).deleteByUser(user);
    }
}
