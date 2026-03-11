package com.example.notesapp.integration;

import com.example.notesapp.entity.EmailVerificationTokenEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.EmailVerificationTokenRepository;
import com.example.notesapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSignupIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private JavaMailSender mailSender;

    @BeforeEach
    void setUp() {
        verificationTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void signupCreatesUserVerificationTokenAndSendsEmail() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"Test@Example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Signup successful. Please verify your email."));

        UserEntity user = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertFalse(user.isEnabled());
        assertThat(user.getPasswordHash()).isNotEqualTo("password123");

        List<EmailVerificationTokenEntity> tokens = verificationTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        EmailVerificationTokenEntity token = tokens.get(0);
        assertThat(token.getUser().getId()).isEqualTo(user.getId());
        assertThat(token.getExpiresAt()).isAfter(Instant.now());

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly("test@example.com");
        assertThat(message.getSubject()).isEqualTo("Verify your account");
        assertThat(message.getText()).contains("http://frontend.test/verify-email?token=");
        assertThat(message.getText()).contains(token.getToken());
    }

    @Test
    void signupRejectsDuplicateEmail() throws Exception {
        userRepository.save(UserEntity.builder()
                .email("dup@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .enabled(false)
                .createdAt(Instant.now())
                .build());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"dup@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already registered"));

        verifyNoInteractions(mailSender);
    }
}
