package com.example.notesapp.controller;

import com.example.notesapp.dto.CreateTagRequest;
import com.example.notesapp.dto.RenameTagRequest;
import com.example.notesapp.security.JwtAuthenticationFilter;
import com.example.notesapp.service.CustomUserDetailsService;
import com.example.notesapp.service.TagService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TagController.class)
@AutoConfigureMockMvc(addFilters = false)
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TagService tagService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void listAllReturnsTagNames() throws Exception {
        when(tagService.listAll()).thenReturn(List.of("alpha", "work"));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("alpha"))
                .andExpect(jsonPath("$[1]").value("work"));
    }

    @Test
    void createReturnsCreated() throws Exception {
        mockMvc.perform(post("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTagRequest("work"))))
                .andExpect(status().isCreated());

        verify(tagService).create("work");
    }

    @Test
    void renameReturnsNoContent() throws Exception {
        mockMvc.perform(put("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RenameTagRequest("old", "new"))))
                .andExpect(status().isNoContent());

        verify(tagService).rename("old", "new");
    }

    @Test
    void deleteReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/tags/work"))
                .andExpect(status().isNoContent());

        verify(tagService).delete("work");
    }

    @Test
    void createReturnsBadRequestForBlankName() throws Exception {
        mockMvc.perform(post("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateTagRequest(""))))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(tagService);
    }
}
