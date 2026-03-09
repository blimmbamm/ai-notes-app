package com.example.notesapp.controller;

import com.example.notesapp.dto.NoteRequest;
import com.example.notesapp.dto.NoteResponse;
import com.example.notesapp.security.JwtAuthenticationFilter;
import com.example.notesapp.service.CustomUserDetailsService;
import com.example.notesapp.service.NoteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NoteController.class)
@AutoConfigureMockMvc(addFilters = false)
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NoteService noteService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void listReturnsNotesFromService() throws Exception {
        NoteResponse note = new NoteResponse(1L, "Title", "Body", "#aabbcc", List.of("work"),
                Instant.parse("2026-01-01T00:00:00Z"), Instant.parse("2026-01-01T01:00:00Z"));
        when(noteService.listNotes()).thenReturn(List.of(note));

        mockMvc.perform(get("/api/notes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Title"));
    }

    @Test
    void createReturnsCreatedNote() throws Exception {
        NoteResponse response = new NoteResponse(2L, "Title", "Body", "#aabbcc", List.of(),
                Instant.parse("2026-01-01T00:00:00Z"), Instant.parse("2026-01-01T00:00:00Z"));
        when(noteService.create(any(NoteRequest.class))).thenReturn(response);

        NoteRequest request = new NoteRequest("Title", "Body", "#aabbcc", List.of("work"));
        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2));
    }

    @Test
    void updateReturnsUpdatedNote() throws Exception {
        NoteResponse response = new NoteResponse(2L, "Updated", "Body", "#ffffff", List.of("x"),
                Instant.parse("2026-01-01T00:00:00Z"), Instant.parse("2026-01-02T00:00:00Z"));
        when(noteService.update(any(Long.class), any(NoteRequest.class))).thenReturn(response);

        NoteRequest request = new NoteRequest("Updated", "Body", "#ffffff", List.of("x"));
        mockMvc.perform(put("/api/notes/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated"));
    }

    @Test
    void deleteReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/notes/7"))
                .andExpect(status().isNoContent());

        verify(noteService).delete(7L);
    }

    @Test
    void createReturnsBadRequestForInvalidColor() throws Exception {
        NoteRequest invalid = new NoteRequest("Title", "Body", "not-a-color", List.of("work"));

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(noteService);
    }
}
