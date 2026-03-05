package com.example.notesapp.service;

import com.example.notesapp.dto.AccountResponse;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.EmailVerificationTokenRepository;
import com.example.notesapp.repository.NoteRepository;
import com.example.notesapp.repository.PasswordResetTokenRepository;
import com.example.notesapp.repository.RefreshTokenRepository;
import com.example.notesapp.repository.TagRepository;
import com.example.notesapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final TagRepository tagRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthService authService;

    public AccountService(CurrentUserService currentUserService,
                          UserRepository userRepository,
                          NoteRepository noteRepository,
                          TagRepository tagRepository,
                          RefreshTokenRepository refreshTokenRepository,
                          EmailVerificationTokenRepository emailVerificationTokenRepository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          AuthService authService) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.tagRepository = tagRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public AccountResponse getCurrentAccount() {
        UserEntity user = currentUserService.getCurrentUser();
        return new AccountResponse(user.getEmail(), user.getCreatedAt());
    }

    @Transactional
    public void requestPasswordResetForCurrentUser() {
        UserEntity user = currentUserService.getCurrentUser();
        authService.requestPasswordReset(user.getEmail());
    }

    @Transactional
    public void deleteCurrentAccount() {
        UserEntity user = currentUserService.getCurrentUser();

        noteRepository.deleteByUser(user);
        tagRepository.deleteByUser(user);
        refreshTokenRepository.deleteByUser(user);
        emailVerificationTokenRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByUser(user);
        userRepository.delete(user);
    }
}
