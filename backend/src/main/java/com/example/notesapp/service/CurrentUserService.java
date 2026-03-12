package com.example.notesapp.service;

import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new NotFoundException("Authenticated user not found");
        }

        String email = resolveEmail(authentication);
        if (email == null || email.isBlank()) {
            throw new NotFoundException("Authenticated user not found");
        }

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private String resolveEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof OidcUser oidcUser) {
            return oidcUser.getEmail();
        }

        if (principal instanceof OAuth2User oAuth2User) {
            Object email = oAuth2User.getAttributes().get("email");
            if (email instanceof String emailValue) {
                return emailValue;
            }
        }

        return authentication.getName();
    }
}
