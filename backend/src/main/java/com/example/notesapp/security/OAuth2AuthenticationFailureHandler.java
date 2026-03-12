package com.example.notesapp.security;

import com.example.notesapp.config.AppProperties;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final AppProperties appProperties;

    public OAuth2AuthenticationFailureHandler(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        org.springframework.security.core.AuthenticationException exception)
            throws IOException, ServletException {
        String error = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
        response.sendRedirect(appProperties.getFrontendUrl() + "/login?oauthError=" + error);
    }
}
