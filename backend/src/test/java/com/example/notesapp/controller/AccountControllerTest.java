package com.example.notesapp.controller;

import com.example.notesapp.dto.AccountResponse;
import com.example.notesapp.security.JwtAuthenticationFilter;
import com.example.notesapp.service.AccountService;
import com.example.notesapp.service.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
@AutoConfigureMockMvc(addFilters = false)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AccountService accountService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void meReturnsCurrentAccount() throws Exception {
        when(accountService.getCurrentAccount()).thenReturn(
                new AccountResponse("u@example.com", Instant.parse("2026-01-01T00:00:00Z"))
        );

        mockMvc.perform(get("/api/account/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("u@example.com"));
    }

    @Test
    void requestPasswordResetReturnsMessage() throws Exception {
        mockMvc.perform(post("/api/account/password-reset-request"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email is registered, a password reset link has been sent."));

        verify(accountService).requestPasswordResetForCurrentUser();
    }

    @Test
    void deleteAccountReturnsMessage() throws Exception {
        mockMvc.perform(delete("/api/account"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted"));

        verify(accountService).deleteCurrentAccount();
    }
}
