package com.example.notesapp.service;

import com.example.notesapp.dto.NoteRequest;
import com.example.notesapp.dto.NoteResponse;
import com.example.notesapp.entity.NoteEntity;
import com.example.notesapp.entity.TagEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.NoteRepository;
import com.example.notesapp.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final TagRepository tagRepository;
    private final CurrentUserService currentUserService;

    public NoteService(NoteRepository noteRepository,
                       TagRepository tagRepository,
                       CurrentUserService currentUserService) {
        this.noteRepository = noteRepository;
        this.tagRepository = tagRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> listNotes() {
        UserEntity user = currentUserService.getCurrentUser();
        return noteRepository.findByUserOrderByUpdatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NoteResponse create(NoteRequest request) {
        UserEntity user = currentUserService.getCurrentUser();
        Instant now = Instant.now();

        NoteEntity note = NoteEntity.builder()
                .user(user)
                .notesColor(normalizeColor(request.colorHex()))
                .tags(resolveTags(user, request.tagNames()))
                .title(request.title().trim())
                .content(request.content().trim())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request) {
        UserEntity user = currentUserService.getCurrentUser();
        NoteEntity note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Note not found"));

        note.setTitle(request.title().trim());
        note.setContent(request.content().trim());
        note.setNotesColor(normalizeColor(request.colorHex()));
        note.setTags(resolveTags(user, request.tagNames()));
        note.setUpdatedAt(Instant.now());

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void delete(Long id) {
        UserEntity user = currentUserService.getCurrentUser();
        NoteEntity note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Note not found"));
        noteRepository.delete(note);
    }

    private String normalizeColor(String colorHex) {
        if (colorHex == null || colorHex.isBlank()) {
            return null;
        }

        return colorHex.trim().toLowerCase(Locale.ROOT);
    }

    private Set<TagEntity> resolveTags(UserEntity user, List<String> rawTagNames) {
        if (rawTagNames == null || rawTagNames.isEmpty()) {
            return new LinkedHashSet<>();
        }

        LinkedHashSet<String> normalizedTagNames = new LinkedHashSet<>();
        for (String rawTag : rawTagNames) {
            if (rawTag == null) {
                continue;
            }

            String normalized = rawTag.trim().toLowerCase(Locale.ROOT);
            if (!normalized.isBlank()) {
                normalizedTagNames.add(normalized);
            }
        }

        if (normalizedTagNames.isEmpty()) {
            return new LinkedHashSet<>();
        }

        List<TagEntity> existingTags = tagRepository.findByUserAndNameIn(user, normalizedTagNames);
        Set<String> existingNames = existingTags.stream().map(TagEntity::getName).collect(java.util.stream.Collectors.toSet());

        List<TagEntity> newTags = new ArrayList<>();
        for (String normalizedName : normalizedTagNames) {
            if (!existingNames.contains(normalizedName)) {
                newTags.add(TagEntity.builder().user(user).name(normalizedName).build());
            }
        }

        if (!newTags.isEmpty()) {
            existingTags.addAll(tagRepository.saveAll(newTags));
        }

        LinkedHashSet<TagEntity> orderedTags = new LinkedHashSet<>();
        for (String normalizedName : normalizedTagNames) {
            existingTags.stream()
                    .filter(tag -> tag.getName().equals(normalizedName))
                    .findFirst()
                    .ifPresent(orderedTags::add);
        }

        return orderedTags;
    }

    private NoteResponse toResponse(NoteEntity note) {
        List<String> tagNames = note.getTags().stream()
                .map(TagEntity::getName)
                .sorted()
                .toList();

        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                note.getNotesColor(),
                tagNames,
                note.getCreatedAt(),
                note.getUpdatedAt());
    }
}
