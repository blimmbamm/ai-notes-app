package com.example.notesapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameTagRequest(
        @NotBlank @Size(max = 40) String currentName,
        @NotBlank @Size(max = 40) String newName
) {
}
