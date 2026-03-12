package com.example.notesapp.service;

import com.example.notesapp.entity.AuthProvider;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.BadRequestException;
import com.example.notesapp.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class OAuthUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final OidcUserService delegate = new OidcUserService();
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public OAuthUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) {
        OidcUser oidcUser = delegate.loadUser(userRequest);
        String email = oidcUser.getEmail();
        Boolean emailVerified = oidcUser.getEmailVerified();
        String providerUserId = oidcUser.getSubject();

        if (email == null || Boolean.FALSE.equals(emailVerified)) {
            throw new BadRequestException("Google account email is not verified");
        }

        userRepository.findByAuthProviderAndProviderUserId(AuthProvider.GOOGLE, providerUserId)
                .orElseGet(() -> {
                    UserEntity existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
                    if (existing != null && existing.getAuthProvider() != AuthProvider.GOOGLE) {
                        throw new BadRequestException("Account exists with password login");
                    }

                    if (existing != null) {
                        existing.setAuthProvider(AuthProvider.GOOGLE);
                        existing.setProviderUserId(providerUserId);
                        existing.setEnabled(true);
                        return userRepository.save(existing);
                    }

                    UserEntity created = UserEntity.builder()
                            .email(email.trim().toLowerCase())
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .authProvider(AuthProvider.GOOGLE)
                            .providerUserId(providerUserId)
                            .enabled(true)
                            .createdAt(Instant.now())
                            .build();
                    return userRepository.save(created);
                });

        return oidcUser;
    }
}
