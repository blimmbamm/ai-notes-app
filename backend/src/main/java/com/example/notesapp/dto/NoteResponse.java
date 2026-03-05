package com.example.notesapp.dto;

import java.time.Instant;
import java.util.List;

public record NoteResponse(
        Long id,
        String title,
        String content,
        String colorHex,
        List<String> tagNames,
        Instant createdAt,
        Instant updatedAt
) {
}
