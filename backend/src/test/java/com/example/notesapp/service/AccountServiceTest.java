package com.example.notesapp.service;

import com.example.notesapp.dto.AccountResponse;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.EmailVerificationTokenRepository;
import com.example.notesapp.repository.NoteRepository;
import com.example.notesapp.repository.PasswordResetTokenRepository;
import com.example.notesapp.repository.RefreshTokenRepository;
import com.example.notesapp.repository.TagRepository;
import com.example.notesapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AccountService accountService;

    @Test
    void getCurrentAccountMapsUserFields() {
        Instant createdAt = Instant.parse("2026-01-01T10:00:00Z");
        UserEntity user = UserEntity.builder().email("u@example.com").createdAt(createdAt).build();
        when(currentUserService.getCurrentUser()).thenReturn(user);

        AccountResponse response = accountService.getCurrentAccount();

        assertEquals("u@example.com", response.email());
        assertEquals(createdAt, response.createdAt());
    }

    @Test
    void requestPasswordResetForCurrentUserDelegatesToAuthService() {
        UserEntity user = UserEntity.builder().email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);

        accountService.requestPasswordResetForCurrentUser();

        verify(authService).requestPasswordReset("u@example.com");
    }

    @Test
    void deleteCurrentAccountDeletesAllUserOwnedData() {
        UserEntity user = UserEntity.builder().email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);

        accountService.deleteCurrentAccount();

        verify(noteRepository).deleteByUser(user);
        verify(tagRepository).deleteByUser(user);
        verify(refreshTokenRepository).deleteByUser(user);
        verify(emailVerificationTokenRepository).deleteByUser(user);
        verify(passwordResetTokenRepository).deleteByUser(user);
        verify(userRepository).delete(user);
    }
}
