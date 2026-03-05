package com.example.notesapp.dto;

import java.time.Instant;

public record NoteResponse(
        Long id,
        String title,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
}
