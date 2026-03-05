package com.example.notesapp.dto;

import java.time.Instant;

public record NoteResponse(
        Long id,
        String title,
        String content,
        String colorHex,
        Instant createdAt,
        Instant updatedAt
) {
}
