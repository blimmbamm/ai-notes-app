package com.example.notesapp.dto;

import java.time.Instant;

public record AccountResponse(
        String email,
        Instant createdAt
) {
}
