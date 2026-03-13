package com.example.notesapp.integration;

import com.example.notesapp.config.AppProperties;
import com.example.notesapp.entity.NoteEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.NoteRepository;
import com.example.notesapp.repository.TagRepository;
import com.example.notesapp.repository.UserRepository;
import com.example.notesapp.security.JwtService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotesSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AppProperties appProperties;

    @BeforeEach
    void setUp() {
        noteRepository.deleteAll();
        tagRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void unauthenticatedRequestsReturn401() throws Exception {
        String payload = "{\"title\":\"Title\",\"content\":\"Body\",\"colorHex\":\"#aabbcc\",\"tagNames\":[\"work\"]}";

        mockMvc.perform(get("/api/notes"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/notes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/notes/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listNotesReturnsOnlyOwnedNotes() throws Exception {
        UserEntity userA = createUser("a@example.com", true);
        UserEntity userB = createUser("b@example.com", true);
        createNote(userA, "A note");
        createNote(userB, "B note");

        mockMvc.perform(get("/api/notes")
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("a@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("A note"));
    }

    @Test
    void createNotePersistsForAuthenticatedUser() throws Exception {
        createUser("creator@example.com", true);
        String payload = "{\"title\":\"  Title  \",\"content\":\"  Body  \",\"colorHex\":\"#AABBCC\",\"tagNames\":[\"Work\"]}";

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("creator@example.com")))
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Title"))
                .andExpect(jsonPath("$.content").value("Body"))
                .andExpect(jsonPath("$.colorHex").value("#aabbcc"))
                .andExpect(jsonPath("$.tagNames[0]").value("work"));

        assertThat(noteRepository.findAll()).hasSize(1);
        NoteEntity note = noteRepository.findAll().get(0);
        UserEntity owner = userRepository.findByEmailIgnoreCase("creator@example.com").orElseThrow();
        assertThat(note.getUser().getId()).isEqualTo(owner.getId());
    }

    @Test
    void updateNoteUpdatesOwnedNote() throws Exception {
        UserEntity user = createUser("owner@example.com", true);
        NoteEntity note = createNote(user, "Old title");
        String payload = "{\"title\":\"New title\",\"content\":\"New body\",\"colorHex\":\"#ffffff\",\"tagNames\":[\"home\"]}";

        mockMvc.perform(put("/api/notes/" + note.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("owner@example.com")))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New title"))
                .andExpect(jsonPath("$.content").value("New body"));

        NoteEntity updated = noteRepository.findById(note.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("New title");
    }

    @Test
    void deleteNoteRemovesOwnedNote() throws Exception {
        UserEntity user = createUser("owner@example.com", true);
        NoteEntity note = createNote(user, "To delete");

        mockMvc.perform(delete("/api/notes/" + note.getId())
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("owner@example.com"))))
                .andExpect(status().isNoContent());

        assertThat(noteRepository.findAll()).isEmpty();
    }

    @Test
    void userCannotUpdateAnotherUsersNote() throws Exception {
        createUser("a@example.com", true);
        UserEntity userB = createUser("b@example.com", true);
        NoteEntity note = createNote(userB, "B note");
        String payload = "{\"title\":\"Hack\",\"content\":\"Hack\",\"colorHex\":\"#ffffff\",\"tagNames\":[\"x\"]}";

        mockMvc.perform(put("/api/notes/" + note.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("a@example.com")))
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Note not found"));
    }

    @Test
    void userCannotDeleteAnotherUsersNote() throws Exception {
        createUser("a@example.com", true);
        UserEntity userB = createUser("b@example.com", true);
        NoteEntity note = createNote(userB, "B note");

        mockMvc.perform(delete("/api/notes/" + note.getId())
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("a@example.com"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Note not found"));
    }

    @Test
    void createNoteRejectsInvalidPayload() throws Exception {
        createUser("creator@example.com", true);
        String payload = "{\"title\":\"\",\"content\":\"Body\",\"colorHex\":\"not-a-color\",\"tagNames\":[\"work\"]}";

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("creator@example.com")))
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateNoteRejectsInvalidPayload() throws Exception {
        UserEntity user = createUser("owner@example.com", true);
        NoteEntity note = createNote(user, "Old title");
        String payload = "{\"title\":\"\",\"content\":\"\",\"colorHex\":\"#12345\",\"tagNames\":[\"work\"]}";

        mockMvc.perform(put("/api/notes/" + note.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", bearerToken(jwtService.generateAccessToken("owner@example.com")))
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void expiredTokenReturns401() throws Exception {
        createUser("expired@example.com", true);
        String token = buildToken("expired@example.com", Instant.now().minus(2, ChronoUnit.HOURS), Instant.now().minus(1, ChronoUnit.HOURS));

        mockMvc.perform(get("/api/notes")
                        .header("Authorization", bearerToken(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tamperedTokenReturns401() throws Exception {
        createUser("tamper@example.com", true);
        String valid = jwtService.generateAccessToken("tamper@example.com");
        String tampered = valid.substring(0, valid.length() - 1) + "x";

        mockMvc.perform(get("/api/notes")
                        .header("Authorization", bearerToken(tampered)))
                .andExpect(status().isUnauthorized());
    }

    private UserEntity createUser(String email, boolean enabled) {
        return userRepository.save(UserEntity.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .enabled(enabled)
                .createdAt(Instant.now())
                .build());
    }

    private NoteEntity createNote(UserEntity user, String title) {
        Instant now = Instant.now();
        return noteRepository.save(NoteEntity.builder()
                .user(user)
                .title(title)
                .content("Body")
                .notesColor("#aabbcc")
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }

    private String buildToken(String email, Instant issuedAt, Instant expiresAt) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(jwtKey(), Jwts.SIG.HS256)
                .compact();
    }

    private SecretKey jwtKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(appProperties.getJwt().getSecret());
        } catch (Exception ex) {
            keyBytes = appProperties.getJwt().getSecret().getBytes();
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
