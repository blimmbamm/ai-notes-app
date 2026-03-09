package com.example.notesapp.controller;

import com.example.notesapp.dto.AuthResponse;
import com.example.notesapp.dto.LoginRequest;
import com.example.notesapp.dto.LogoutRequest;
import com.example.notesapp.dto.PasswordResetConfirmRequest;
import com.example.notesapp.dto.PasswordResetRequest;
import com.example.notesapp.dto.RefreshRequest;
import com.example.notesapp.dto.SignupRequest;
import com.example.notesapp.security.JwtAuthenticationFilter;
import com.example.notesapp.service.AuthService;
import com.example.notesapp.service.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void signupReturnsCreatedAndMessage() throws Exception {
        SignupRequest request = new SignupRequest("user@example.com", "password123");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Signup successful. Please verify your email."));

        verify(authService).signup(any(SignupRequest.class));
    }

    @Test
    void signupReturnsBadRequestForInvalidPayload() throws Exception {
        SignupRequest invalid = new SignupRequest("bad-email", "short");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    @Test
    void verifyDelegatesAndReturnsSuccessMessage() throws Exception {
        mockMvc.perform(get("/api/auth/verify").param("token", "token-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully"));

        verify(authService).verifyEmail("token-1");
    }

    @Test
    void loginReturnsAuthResponseBody() throws Exception {
        AuthResponse response = new AuthResponse("access", "refresh", "Bearer", 900);
        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("user@example.com", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresInSeconds").value(900));
    }

    @Test
    void refreshDelegatesAndReturnsAuthResponseBody() throws Exception {
        AuthResponse response = new AuthResponse("access2", "refresh2", "Bearer", 600);
        when(authService.refresh(any(RefreshRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RefreshRequest("rt-1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access2"));
    }

    @Test
    void logoutReturnsMessage() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LogoutRequest("rt-1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out"));

        verify(authService).logout(any(LogoutRequest.class));
    }

    @Test
    void passwordResetRequestReturnsMessage() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PasswordResetRequest("u@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email is registered, a password reset link has been sent."));

        verify(authService).requestPasswordReset("u@example.com");
    }

    @Test
    void passwordResetConfirmReturnsMessage() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PasswordResetConfirmRequest("t-1", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));

        verify(authService).confirmPasswordReset(any(PasswordResetConfirmRequest.class));
    }
}
