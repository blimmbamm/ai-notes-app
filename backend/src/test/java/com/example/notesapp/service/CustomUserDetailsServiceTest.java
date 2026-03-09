package com.example.notesapp.service;

import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsernameThrowsWhenUserNotFound() {
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("missing@example.com"));
    }

    @Test
    void loadUserByUsernameMapsUserToSpringSecurityUser() {
        UserEntity user = UserEntity.builder()
                .email("u@example.com")
                .passwordHash("hash")
                .enabled(true)
                .build();
        when(userRepository.findByEmailIgnoreCase("u@example.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("u@example.com");

        assertEquals("u@example.com", details.getUsername());
        assertEquals("hash", details.getPassword());
        assertTrue(details.isEnabled());
        assertFalse(details.getAuthorities().isEmpty());
    }
}
