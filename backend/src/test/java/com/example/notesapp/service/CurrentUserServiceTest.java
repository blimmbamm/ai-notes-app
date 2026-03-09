package com.example.notesapp.service;

import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CurrentUserService currentUserService;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserThrowsWhenAuthenticationMissing() {
        SecurityContextHolder.clearContext();

        assertThrows(NotFoundException.class, () -> currentUserService.getCurrentUser());
    }

    @Test
    void getCurrentUserThrowsWhenAuthenticatedUserNotFoundInDatabase() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("u@example.com", null)
        );
        when(userRepository.findByEmailIgnoreCase("u@example.com")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> currentUserService.getCurrentUser());
    }

    @Test
    void getCurrentUserReturnsUserEntityFromRepository() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("u@example.com", null)
        );
        when(userRepository.findByEmailIgnoreCase("u@example.com")).thenReturn(Optional.of(user));

        UserEntity result = currentUserService.getCurrentUser();

        assertEquals(user, result);
    }
}
