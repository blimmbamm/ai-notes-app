package com.example.notesapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record NoteRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 4000) String content,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a hex value like #aabbcc") String colorHex,
        List<@NotBlank @Size(max = 40) String> tagNames
) {
}
