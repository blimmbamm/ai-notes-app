package com.example.notesapp.security;

import com.example.notesapp.config.AppProperties;
import com.example.notesapp.dto.AuthResponse;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.BadRequestException;
import com.example.notesapp.repository.UserRepository;
import com.example.notesapp.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final AppProperties appProperties;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository,
                                              AuthService authService,
                                              AuthCookieService authCookieService,
                                              AppProperties appProperties) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.authCookieService = authCookieService;
        this.appProperties = appProperties;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof OidcUser oidcUser)) {
            throw new BadRequestException("Unsupported OAuth principal");
        }

        String email = oidcUser.getEmail();
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("User not found after OAuth login"));

        AuthResponse tokens = authService.issueTokens(user);
        authCookieService.setAuthCookies(response, tokens);

        response.sendRedirect(appProperties.getFrontendUrl() + "/notes");
    }
}
